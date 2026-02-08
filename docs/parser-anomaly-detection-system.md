# Parser Anomaly Detection System - Implementation Plan

**Created:** 2026-02-07  
**Status:** Partially Implemented (Phases 1-3 Complete - 2026-02-08)  
**Priority:** Medium  
**Estimated Effort:** 10-15 hours  

## Problem Statement

Currently, parser debug data (warnings, anomalies, performance metrics) is ephemeral and discarded after parsing. This makes it impossible to:

- Track parser quality trends over time
- Detect regressions automatically
- Identify problematic receipt formats
- Measure parser improvement effectiveness
- Alert on parser failures proactively

The recent "Sunny Soda quantity bug" (qty=52 instead of 2) was only discovered through manual review. A systematic detection system would have caught this automatically.

---

## Goals

1. **Persistent Storage** - Save all parser debug data for historical analysis
2. **Anomaly Detection** - Automatically flag suspicious parsing results
3. **Visibility** - Provide admin dashboard showing parser health
4. **Proactive Alerting** - Notify when parser quality degrades
5. **Regression Prevention** - Automated testing to catch parser breaks

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Persistent Debug Storage (Foundation)              │
│ - Add parser_metadata to receipts table                     │
│ - Store warnings, anomalies, performance metrics            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Automated Anomaly Detection (Rules-Based)          │
│ - Detect absurd unit prices, high quantities, etc.          │
│ - Flag receipts with anomalies for review                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Analytics Dashboard (Visibility)                   │
│ - Admin panel showing parser health score                   │
│ - Recent anomalies feed                                     │
│ - Store-level parsing accuracy                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Proactive Monitoring (Alerting)                    │
│ - Hourly anomaly spike detection                            │
│ - In-app admin notifications                                │
│ - Email alerts for critical issues                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Continuous Regression Testing (Preventative)       │
│ - Golden receipt set (20-30 known-good receipts)            │
│ - Scheduled daily bulk tests (GitHub Actions)               │
│ - Alert on accuracy drops below 95%                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation - Persistent Debug Storage

**Estimated Effort:** 1-2 hours  
**Priority:** HIGH (Prerequisite for all other phases)

### 1.1 Database Schema Changes

**Option A: Add Column to `receipts` Table (Recommended)**

```sql
-- Migration: Add parser_metadata to receipts
ALTER TABLE receipts ADD COLUMN parser_metadata JSONB;

-- Index for querying anomalies
CREATE INDEX idx_receipts_parser_anomalies 
ON receipts USING GIN ((parser_metadata->'anomalies'));

-- Index for parser method filtering
CREATE INDEX idx_receipts_parser_method 
ON receipts ((parser_metadata->>'method'));
```

**Pros:**
- Simple - all receipt data in one table
- Easy joins with transactions
- No additional foreign keys needed

**Cons:**
- Increases receipts table size
- Parser metadata mixes with domain data

**Option B: Separate `parser_logs` Table**

```sql
CREATE TABLE parser_logs (
  id SERIAL PRIMARY KEY,
  receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  parser_method TEXT NOT NULL, -- 'structured' | 'ai' | 'fallback'
  parser_type TEXT, -- 'ICA_Kvantum' | 'Willys' | 'ICA_Standard'
  parser_version TEXT, -- 'v2', 'experimental'
  parsing_time_ms INT,
  items_found INT,
  lines_processed INT,
  fallback_used BOOLEAN DEFAULT false,
  warnings TEXT[], -- Array of warning messages
  anomalies JSONB, -- Structured anomaly data
  debug_log TEXT[], -- Full debug log
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_parser_logs_receipt_id ON parser_logs(receipt_id);
CREATE INDEX idx_parser_logs_anomalies ON parser_logs USING GIN (anomalies);
CREATE INDEX idx_parser_logs_created_at ON parser_logs(created_at DESC);
```

**Pros:**
- Clean separation of concerns
- Can store multiple parse attempts per receipt
- Easier to purge old logs

**Cons:**
- Additional table join overhead
- More complex queries

**Decision: Use Option A (column on receipts)** - Simpler, and we typically only parse each receipt once.

### 1.2 Parser Metadata Schema

```typescript
interface ParserMetadata {
  method: 'structured' | 'ai' | 'fallback';
  parser_type?: 'ICA_Kvantum' | 'Willys' | 'ICA_Standard';
  parser_version: string; // 'v2', 'experimental'
  parsing_time_ms: number;
  items_found: number;
  lines_processed?: number;
  fallback_used: boolean;
  
  // Statistics
  stats?: {
    multiline_products: number;
    discounts_applied: number;
    pant_items: number;
    calculated_total: number;
    receipt_total?: number;
    total_difference?: number;
  };
  
  // Warnings (non-critical issues)
  warnings: string[];
  
  // Anomalies (suspicious results)
  anomalies: Array<{
    type: 'absurd_unit_price' | 'high_quantity' | 'total_mismatch' 
        | 'missing_metadata' | 'zero_items' | 'negative_price';
    severity: 'low' | 'medium' | 'high';
    item_name?: string;
    details: Record<string, any>;
  }>;
  
  // Debugging (truncated in production)
  debug_log_summary?: string; // First 5 and last 5 lines only
}
```

**Example data:**
```json
{
  "method": "structured",
  "parser_type": "ICA_Kvantum",
  "parser_version": "v2",
  "parsing_time_ms": 3,
  "items_found": 45,
  "lines_processed": 80,
  "fallback_used": false,
  "stats": {
    "multiline_products": 3,
    "discounts_applied": 3,
    "pant_items": 8,
    "calculated_total": 1353.53,
    "receipt_total": 1353.53,
    "total_difference": 0
  },
  "warnings": [
    "⚠️ Qty sanity fail: extracted 52 gives 0.66 kr/st - using qty=1"
  ],
  "anomalies": [
    {
      "type": "absurd_unit_price",
      "severity": "medium",
      "item_name": "Sunny Soda Nocco2F38",
      "details": {
        "extracted_qty": 52,
        "fallback_qty": 1,
        "calculated_unit_price": 0.66,
        "final_unit_price": 34.1
      }
    }
  ],
  "debug_log_summary": "📋 ICA Kvantum Parser Starting...\n...\n✅ ICA Kvantum parsing succeeded: 45 items"
}
```

### 1.3 Code Changes

**File:** `supabase/functions/parse-receipt/index.ts`

**Changes needed:**

1. **Build anomalies array during parsing:**
```typescript
// Around line 584 (after unit price sanity check)
const anomalies: any[] = [];

if (impliedUnitPrice < 1) {
  anomalies.push({
    type: 'absurd_unit_price',
    severity: 'medium',
    item_name: name,
    details: {
      extracted_qty: extractedQty,
      fallback_qty: 1,
      calculated_unit_price: impliedUnitPrice,
      total: total
    }
  });
  debugLog.push(`    ⚠️ Qty sanity fail: extracted ${extractedQty} gives ${impliedUnitPrice.toFixed(2)} kr/st - using qty=1`);
}
```

2. **Store parser_metadata when inserting receipt:**
```typescript
// Around line 2180 (in storeStructuredResultToDatabase)
const parserMetadata = {
  method: 'structured',
  parser_type: isWillys ? 'Willys' : isICATableFormat ? 'ICA_Kvantum' : 'ICA_Standard',
  parser_version: selectedVersion,
  parsing_time_ms: parseEndTime - parseStartTime,
  items_found: items.length,
  lines_processed: structuredResult._debug?.lines_processed,
  fallback_used: false,
  stats: {
    multiline_products: structuredResult._debug?.multiline_count,
    discounts_applied: structuredResult._debug?.discount_count,
    pant_items: structuredResult._debug?.pant_count,
    calculated_total: structuredResult.total_amount
  },
  warnings: structuredResult._debug?.debugLog?.filter(l => l.includes('⚠️')) || [],
  anomalies: anomalies, // From parsing
  debug_log_summary: getDebugLogSummary(structuredResult._debug?.debugLog)
};

// Update receipt insert
const { data: receiptData, error: receiptError } = await supabase
  .from('receipts')
  .insert({
    user_id: userId,
    pdf_url: pdfUrl,
    store_name: storeName,
    receipt_date: receiptDate,
    total_amount: totalAmount,
    parser_metadata: parserMetadata // ADD THIS
  })
  .select('id')
  .single();
```

3. **Helper function to summarize debug logs:**
```typescript
function getDebugLogSummary(debugLog?: string[]): string {
  if (!debugLog || debugLog.length === 0) return '';
  if (debugLog.length <= 10) return debugLog.join('\n');
  
  // First 5 and last 5 lines only
  const first = debugLog.slice(0, 5).join('\n');
  const last = debugLog.slice(-5).join('\n');
  return `${first}\n... (${debugLog.length - 10} lines omitted) ...\n${last}`;
}
```

### 1.4 Testing

- Run bulk test to verify parser_metadata is stored
- Query `receipts` table to confirm JSONB structure
- Verify anomalies are captured correctly

---

## Phase 2: Automated Anomaly Detection

**Estimated Effort:** 2-3 hours  
**Priority:** HIGH

### 2.1 Anomaly Detection Rules

| Anomaly Type | Detection Rule | Severity | Details Captured |
|--------------|----------------|----------|------------------|
| **absurd_unit_price** | `unit_price < 0.50 kr` for 'st' items | Medium | item_name, extracted_qty, calculated_unit_price |
| **high_quantity** | `quantity > 30` for 'st' items | Low | item_name, quantity |
| **negative_price** | `price < 0` (not discount) | High | item_name, price |
| **zero_items** | Parser found 0 items | High | store_name, text_length |
| **total_mismatch** | `abs(calculated - receipt_total) > 10 kr` | Medium | calculated_total, receipt_total, difference |
| **missing_store** | `store_name` is null or generic | Medium | extracted_store_name |
| **missing_date** | `receipt_date` is null | Medium | pdf_filename |
| **excessive_parsing_time** | `parsing_time_ms > 30000` (30s) | Low | parsing_time_ms, items_found |
| **fallback_used** | Structured parser failed, used AI | Low | parser_type, failure_reason |

### 2.2 Implementation

**File:** `supabase/functions/parse-receipt/index.ts`

**Add anomaly detection function:**

```typescript
interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  item_name?: string;
  details: Record<string, any>;
}

function detectAnomalies(
  items: ParsedItem[],
  storeName: string | null,
  receiptDate: string | null,
  calculatedTotal: number,
  receiptTotal: number | null,
  parsingTimeMs: number,
  debugLog: string[]
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  
  // 1. Check for absurd unit prices or high quantities
  items.forEach(item => {
    if (item.unit_price && item.unit_price < 0.50 && item.unit === 'st') {
      anomalies.push({
        type: 'absurd_unit_price',
        severity: 'medium',
        item_name: item.name,
        details: {
          unit_price: item.unit_price,
          quantity: item.quantity,
          total: item.price
        }
      });
    }
    
    if (item.quantity > 30 && item.unit === 'st') {
      anomalies.push({
        type: 'high_quantity',
        severity: 'low',
        item_name: item.name,
        details: {
          quantity: item.quantity,
          unit_price: item.unit_price
        }
      });
    }
    
    if (item.price < 0 && !item.name.toLowerCase().includes('rabatt') 
        && !item.name.toLowerCase().includes('discount')
        && !item.name.toLowerCase().includes('kupong')) {
      anomalies.push({
        type: 'negative_price',
        severity: 'high',
        item_name: item.name,
        details: {
          price: item.price
        }
      });
    }
  });
  
  // 2. Check for zero items
  if (items.length === 0) {
    anomalies.push({
      type: 'zero_items',
      severity: 'high',
      details: {
        store_name: storeName,
        debug_lines: debugLog.length
      }
    });
  }
  
  // 3. Check for total mismatch
  if (receiptTotal && Math.abs(calculatedTotal - receiptTotal) > 10) {
    anomalies.push({
      type: 'total_mismatch',
      severity: 'medium',
      details: {
        calculated_total: calculatedTotal,
        receipt_total: receiptTotal,
        difference: calculatedTotal - receiptTotal
      }
    });
  }
  
  // 4. Check for missing metadata
  if (!storeName || storeName === 'ICA' || storeName === 'Willys') {
    anomalies.push({
      type: 'missing_store',
      severity: 'medium',
      details: {
        extracted_store: storeName
      }
    });
  }
  
  if (!receiptDate) {
    anomalies.push({
      type: 'missing_date',
      severity: 'medium',
      details: {}
    });
  }
  
  // 5. Check for excessive parsing time
  if (parsingTimeMs > 30000) {
    anomalies.push({
      type: 'excessive_parsing_time',
      severity: 'low',
      details: {
        parsing_time_ms: parsingTimeMs,
        items_found: items.length
      }
    });
  }
  
  return anomalies;
}
```

**Usage:**
```typescript
// After parsing completes
const anomalies = detectAnomalies(
  items,
  storeName,
  receiptDate,
  calculatedTotal,
  receiptTotal,
  parsingTimeMs,
  debugLog
);

// Include in parser_metadata
parserMetadata.anomalies = anomalies;
```

### 2.3 Testing

- Test each anomaly type with crafted receipts
- Verify severity levels are appropriate
- Ensure anomalies don't break parsing pipeline

---

## Phase 3: Analytics Dashboard (Visibility)

**Estimated Effort:** 3-4 hours  
**Priority:** MEDIUM

### 3.1 Database Views

**File:** New migration `supabase/migrations/YYYYMMDD_parser_analytics_views.sql`

```sql
-- View: Parser anomalies with receipt context
CREATE VIEW parser_anomalies AS
SELECT 
  r.id as receipt_id,
  r.user_id,
  r.store_name,
  r.receipt_date,
  r.total_amount,
  r.created_at,
  r.parser_metadata->>'method' as parser_method,
  r.parser_metadata->>'parser_type' as parser_type,
  r.parser_metadata->>'parser_version' as parser_version,
  (r.parser_metadata->>'parsing_time_ms')::int as parsing_time_ms,
  (r.parser_metadata->>'items_found')::int as items_found,
  (r.parser_metadata->>'fallback_used')::boolean as fallback_used,
  jsonb_array_length(COALESCE(r.parser_metadata->'anomalies', '[]'::jsonb)) as anomaly_count,
  r.parser_metadata->'anomalies' as anomalies,
  array_length(
    ARRAY(SELECT jsonb_array_elements_text(r.parser_metadata->'warnings')), 
    1
  ) as warning_count,
  r.parser_metadata->'warnings' as warnings
FROM receipts r
WHERE r.parser_metadata IS NOT NULL
ORDER BY r.created_at DESC;

-- View: Parser health metrics
CREATE VIEW parser_health_metrics AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_receipts,
  SUM(CASE WHEN (parser_metadata->>'fallback_used')::boolean THEN 1 ELSE 0 END) as fallback_count,
  SUM(CASE WHEN jsonb_array_length(COALESCE(parser_metadata->'anomalies', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) as receipts_with_anomalies,
  AVG((parser_metadata->>'parsing_time_ms')::int) as avg_parsing_time_ms,
  AVG((parser_metadata->>'items_found')::int) as avg_items_per_receipt
FROM receipts
WHERE parser_metadata IS NOT NULL
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- View: Anomaly type breakdown
CREATE VIEW anomaly_type_breakdown AS
SELECT
  anomaly->>'type' as anomaly_type,
  anomaly->>'severity' as severity,
  COUNT(*) as occurrence_count,
  array_agg(DISTINCT r.store_name) as affected_stores,
  MAX(r.created_at) as last_seen
FROM receipts r,
  jsonb_array_elements(COALESCE(r.parser_metadata->'anomalies', '[]'::jsonb)) as anomaly
WHERE r.parser_metadata IS NOT NULL
GROUP BY anomaly->>'type', anomaly->>'severity'
ORDER BY occurrence_count DESC;

-- View: Store-level parser accuracy
CREATE VIEW store_parser_accuracy AS
SELECT
  store_name,
  COUNT(*) as total_receipts,
  SUM(CASE WHEN (parser_metadata->>'fallback_used')::boolean THEN 1 ELSE 0 END) as fallback_count,
  ROUND(
    100.0 * (1 - SUM(CASE WHEN (parser_metadata->>'fallback_used')::boolean THEN 1 ELSE 0 END)::numeric / COUNT(*)),
    2
  ) as structured_success_rate,
  SUM(CASE WHEN jsonb_array_length(COALESCE(parser_metadata->'anomalies', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) as receipts_with_anomalies,
  AVG((parser_metadata->>'parsing_time_ms')::int) as avg_parsing_time_ms
FROM receipts
WHERE parser_metadata IS NOT NULL
  AND store_name IS NOT NULL
GROUP BY store_name
ORDER BY total_receipts DESC;
```

### 3.2 React Component: Parser Health Dashboard

**File:** `src/components/admin/ParserHealthDashboard.tsx`

```tsx
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";

interface ParserHealthMetrics {
  date: string;
  total_receipts: number;
  fallback_count: number;
  receipts_with_anomalies: number;
  avg_parsing_time_ms: number;
  avg_items_per_receipt: number;
}

interface AnomalyTypeStat {
  anomaly_type: string;
  severity: string;
  occurrence_count: number;
  affected_stores: string[];
  last_seen: string;
}

interface RecentAnomaly {
  receipt_id: string;
  store_name: string;
  receipt_date: string;
  created_at: string;
  anomaly_count: number;
  anomalies: any[];
}

export function ParserHealthDashboard() {
  // Fetch health metrics (last 7 days)
  const { data: healthMetrics } = useQuery({
    queryKey: ["parser-health-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parser_health_metrics")
        .select("*")
        .order("date", { ascending: false })
        .limit(7);
      
      if (error) throw error;
      return data as ParserHealthMetrics[];
    },
  });

  // Fetch anomaly type breakdown
  const { data: anomalyTypes } = useQuery({
    queryKey: ["anomaly-type-breakdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anomaly_type_breakdown")
        .select("*")
        .order("occurrence_count", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as AnomalyTypeStat[];
    },
  });

  // Fetch recent anomalies
  const { data: recentAnomalies } = useQuery({
    queryKey: ["recent-anomalies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parser_anomalies")
        .select("*")
        .gt("anomaly_count", 0)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as RecentAnomaly[];
    },
  });

  // Calculate health score
  const calculateHealthScore = (metrics: ParserHealthMetrics[]): number => {
    if (!metrics || metrics.length === 0) return 100;
    
    const recent = metrics[0];
    const fallbackRate = (recent.fallback_count / recent.total_receipts) * 100;
    const anomalyRate = (recent.receipts_with_anomalies / recent.total_receipts) * 100;
    
    // Score: 100 - (fallback_rate * 0.5) - (anomaly_rate * 0.5)
    return Math.max(0, Math.round(100 - (fallbackRate * 0.5) - (anomalyRate * 0.5)));
  };

  const healthScore = healthMetrics ? calculateHealthScore(healthMetrics) : null;
  const recentMetrics = healthMetrics?.[0];

  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
    };
    return <Badge className={colors[severity as keyof typeof colors]}>{severity}</Badge>;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Parser Health Dashboard</h2>

      {/* Health Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Parser Health</CardTitle>
        </CardHeader>
        <CardContent>
          {healthScore !== null && recentMetrics ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Health Score</p>
                  <p className={`text-4xl font-bold ${getHealthColor(healthScore)}`}>
                    {healthScore}%
                  </p>
                </div>
                {healthScore >= 90 ? (
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                ) : (
                  <AlertTriangle className="h-12 w-12 text-yellow-600" />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Receipts Today</p>
                  <p className="text-2xl font-semibold">{recentMetrics.total_receipts}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AI Fallback Rate</p>
                  <p className="text-2xl font-semibold">
                    {((recentMetrics.fallback_count / recentMetrics.total_receipts) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receipts with Anomalies</p>
                  <p className="text-2xl font-semibold">{recentMetrics.receipts_with_anomalies}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Parse Time</p>
                  <p className="text-2xl font-semibold">{Math.round(recentMetrics.avg_parsing_time_ms)}ms</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No parser metrics available</p>
          )}
        </CardContent>
      </Card>

      {/* Anomaly Types Card */}
      <Card>
        <CardHeader>
          <CardTitle>Anomaly Types</CardTitle>
        </CardHeader>
        <CardContent>
          {anomalyTypes && anomalyTypes.length > 0 ? (
            <div className="space-y-3">
              {anomalyTypes.map((anomaly) => (
                <div key={anomaly.anomaly_type} className="flex items-center justify-between p-3 border rounded">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{anomaly.anomaly_type.replace(/_/g, ' ')}</p>
                      {getSeverityBadge(anomaly.severity)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {anomaly.affected_stores.length} stores affected
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{anomaly.occurrence_count}</p>
                    <p className="text-xs text-muted-foreground">occurrences</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No anomalies detected</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Anomalies Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Anomalies</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAnomalies && recentAnomalies.length > 0 ? (
            <div className="space-y-3">
              {recentAnomalies.map((receipt) => (
                <Alert key={receipt.receipt_id}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>
                    {receipt.store_name} - {receipt.receipt_date}
                  </AlertTitle>
                  <AlertDescription>
                    <p className="text-sm mb-2">
                      {receipt.anomaly_count} anomaly(ies) detected:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {receipt.anomalies.map((anomaly: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          <span className="font-medium">{anomaly.type.replace(/_/g, ' ')}</span>
                          {anomaly.item_name && ` - ${anomaly.item_name}`}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No recent anomalies</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3.3 Add to Admin Page

**File:** `src/pages/Admin.tsx`

```tsx
import { ParserHealthDashboard } from "@/components/admin/ParserHealthDashboard";

// Inside Admin component, add new tab:
<TabsContent value="parser-health">
  <ParserHealthDashboard />
</TabsContent>
```

### 3.4 Testing

- Verify dashboard loads with existing receipts
- Check that anomaly counts are accurate
- Test with receipts with known anomalies

---

## Phase 4: Proactive Monitoring (Alerting)

**Estimated Effort:** 2-3 hours  
**Priority:** MEDIUM

### 4.1 Notification System

**Create in-app notification store:**

**File:** `src/lib/notificationStore.ts`

```typescript
import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
  
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },
  
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
  
  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
```

### 4.2 Anomaly Monitor Edge Function

**File:** `supabase/functions/monitor-parser-health/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface AnomalyAlert {
  type: 'anomaly_spike' | 'fallback_spike' | 'parsing_failure';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: Record<string, any>;
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const alerts: AnomalyAlert[] = [];
    
    // Check last hour's metrics
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentReceipts, error } = await supabase
      .from('receipts')
      .select('parser_metadata, created_at')
      .gte('created_at', oneHourAgo)
      .not('parser_metadata', 'is', null);
    
    if (error) throw error;
    
    if (recentReceipts && recentReceipts.length > 0) {
      const totalReceipts = recentReceipts.length;
      
      // Count receipts with anomalies
      const receiptsWithAnomalies = recentReceipts.filter(r => 
        r.parser_metadata?.anomalies?.length > 0
      ).length;
      
      const anomalyRate = (receiptsWithAnomalies / totalReceipts) * 100;
      
      // Alert if > 10% have anomalies
      if (anomalyRate > 10) {
        alerts.push({
          type: 'anomaly_spike',
          severity: anomalyRate > 30 ? 'high' : 'medium',
          message: `Anomaly rate is ${anomalyRate.toFixed(1)}% (${receiptsWithAnomalies}/${totalReceipts} receipts)`,
          details: {
            anomaly_rate: anomalyRate,
            receipts_with_anomalies: receiptsWithAnomalies,
            total_receipts: totalReceipts,
            time_window: 'last_hour'
          }
        });
      }
      
      // Count fallback usage
      const fallbackUsed = recentReceipts.filter(r => 
        r.parser_metadata?.fallback_used === true
      ).length;
      
      const fallbackRate = (fallbackUsed / totalReceipts) * 100;
      
      // Alert if > 30% used fallback
      if (fallbackRate > 30) {
        alerts.push({
          type: 'fallback_spike',
          severity: fallbackRate > 50 ? 'high' : 'medium',
          message: `Structured parser fallback rate is ${fallbackRate.toFixed(1)}% (${fallbackUsed}/${totalReceipts} receipts)`,
          details: {
            fallback_rate: fallbackRate,
            fallback_count: fallbackUsed,
            total_receipts: totalReceipts,
            time_window: 'last_hour'
          }
        });
      }
    }
    
    // Store alerts in database (for in-app notifications)
    if (alerts.length > 0) {
      const { error: insertError } = await supabase
        .from('parser_alerts')
        .insert(alerts.map(alert => ({
          alert_type: alert.type,
          severity: alert.severity,
          message: alert.message,
          details: alert.details,
          created_at: new Date().toISOString()
        })));
      
      if (insertError) {
        console.error('Failed to store alerts:', insertError);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        alerts_generated: alerts.length,
        alerts: alerts
      }),
      { headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error('Monitor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

### 4.3 Parser Alerts Table

**File:** New migration `supabase/migrations/YYYYMMDD_parser_alerts.sql`

```sql
CREATE TABLE parser_alerts (
  id SERIAL PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'anomaly_spike' | 'fallback_spike' | 'parsing_failure'
  severity TEXT NOT NULL, -- 'low' | 'medium' | 'high'
  message TEXT NOT NULL,
  details JSONB,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_parser_alerts_created_at ON parser_alerts(created_at DESC);
CREATE INDEX idx_parser_alerts_acknowledged ON parser_alerts(acknowledged);

-- Enable RLS
ALTER TABLE parser_alerts ENABLE ROW LEVEL SECURITY;

-- Admin-only policy
CREATE POLICY "Admin can view all alerts"
  ON parser_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@admin.com' -- Adjust based on your admin identification
    )
  );
```

### 4.4 Schedule Monitor Function

**Use Supabase Cron (pg_cron extension):**

```sql
-- Run monitor-parser-health every hour
SELECT cron.schedule(
  'parser-health-monitor',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/monitor-parser-health',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  )
  $$
);
```

**Alternative: Vercel Cron** (if preferred)

**File:** `vercel.json`

```json
{
  "crons": [{
    "path": "/api/cron/monitor-parser-health",
    "schedule": "0 * * * *"
  }]
}
```

**File:** `pages/api/cron/monitor-parser-health.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Call Supabase Edge Function
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/monitor-parser-health`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  
  const data = await response.json();
  res.status(200).json(data);
}
```

### 4.5 In-App Notification Display

**File:** `src/components/admin/NotificationBell.tsx`

```tsx
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function NotificationBell() {
  const { data: alerts } = useQuery({
    queryKey: ["parser-alerts", "unacknowledged"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parser_alerts")
        .select("*")
        .eq("acknowledged", false)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const unreadCount = alerts?.length || 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {alerts && alerts.length > 0 ? (
          alerts.map((alert) => (
            <DropdownMenuItem key={alert.id} className="flex-col items-start">
              <div className="font-medium">{alert.message}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(alert.created_at).toLocaleString('sv-SE')}
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No new alerts</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Add to AppLayout navigation:**

```tsx
import { NotificationBell } from "@/components/admin/NotificationBell";

// In navigation section
{isAdmin && <NotificationBell />}
```

### 4.6 Testing

- Deploy monitor-parser-health function
- Schedule cron job
- Manually trigger with high anomaly receipts
- Verify alerts appear in NotificationBell

---

## Phase 5: Continuous Regression Testing

**Estimated Effort:** 4-6 hours  
**Priority:** LOW (Nice to have)

### 5.1 Golden Receipt Set

**Create test receipt repository:**

**File:** `test-receipts/golden-set/README.md`

```markdown
# Golden Receipt Set

This directory contains known-good receipts used for regression testing.

## Structure

Each receipt has:
- `STORE_DATE.pdf` - Original PDF
- `STORE_DATE.json` - Expected parsing result (ground truth)

## Adding New Golden Receipts

1. Parse receipt and verify it's 100% accurate
2. Export parsing result as JSON
3. Add both files to this directory
4. Update golden-set-index.json

## Maintenance

Review and update quarterly to ensure test coverage of:
- All supported store types (ICA Kvantum, Willys, etc.)
- Edge cases (multi-buy, discounts, pant, etc.)
- Recent parser bug fixes
```

**File:** `test-receipts/golden-set/golden-set-index.json`

```json
{
  "version": "1.0.0",
  "last_updated": "2026-02-07",
  "receipts": [
    {
      "id": "ica-kvantum-2026-02-05",
      "store_type": "ICA_Kvantum",
      "pdf_file": "ICA_Kvantum_Kungens_Kurva_2026-02-05.pdf",
      "expected_file": "ICA_Kvantum_Kungens_Kurva_2026-02-05.json",
      "items_count": 45,
      "total_amount": 1353.53,
      "notes": "Contains multi-buy items, discounts, pant"
    },
    {
      "id": "willys-2026-02-01",
      "store_type": "Willys",
      "pdf_file": "Willys_Heron_City_2026-02-01.pdf",
      "expected_file": "Willys_Heron_City_2026-02-01.json",
      "items_count": 32,
      "total_amount": 1171.41,
      "notes": "Standard Willys format"
    }
  ]
}
```

### 5.2 Automated Test Script

**File:** `scripts/test-parser-regression.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface GoldenReceipt {
  id: string;
  store_type: string;
  pdf_file: string;
  expected_file: string;
  items_count: number;
  total_amount: number;
  notes?: string;
}

interface TestResult {
  receipt_id: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    items_matched: number;
    items_expected: number;
    price_accuracy: number;
  };
}

async function runRegressionTests(): Promise<TestResult[]> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Load golden set index
  const indexPath = path.join(__dirname, '../test-receipts/golden-set/golden-set-index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  
  const results: TestResult[] = [];
  
  for (const receipt of index.receipts as GoldenReceipt[]) {
    console.log(`Testing: ${receipt.id}...`);
    
    const pdfPath = path.join(__dirname, '../test-receipts/golden-set/', receipt.pdf_file);
    const expectedPath = path.join(__dirname, '../test-receipts/golden-set/', receipt.expected_file);
    
    // Upload PDF to Supabase storage (temp)
    const pdfBuffer = fs.readFileSync(pdfPath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(`test-receipts/${receipt.pdf_file}`, pdfBuffer, {
        upsert: true
      });
    
    if (uploadError) {
      console.error(`Upload failed for ${receipt.id}:`, uploadError);
      continue;
    }
    
    const pdfUrl = supabase.storage.from('receipts').getPublicUrl(uploadData.path).data.publicUrl;
    
    // Parse receipt
    const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-receipt', {
      body: { pdfUrl }
    });
    
    if (parseError) {
      results.push({
        receipt_id: receipt.id,
        passed: false,
        errors: [`Parse error: ${parseError.message}`],
        warnings: [],
        metrics: { items_matched: 0, items_expected: receipt.items_count, price_accuracy: 0 }
      });
      continue;
    }
    
    // Load expected result
    const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf-8'));
    
    // Compare results
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check items count
    const actualItemsCount = parseResult.structured_items?.length || 0;
    if (actualItemsCount !== receipt.items_count) {
      errors.push(`Items count mismatch: expected ${receipt.items_count}, got ${actualItemsCount}`);
    }
    
    // Check total amount
    if (Math.abs(parseResult.total_amount - receipt.total_amount) > 0.01) {
      errors.push(`Total amount mismatch: expected ${receipt.total_amount}, got ${parseResult.total_amount}`);
    }
    
    // Check for anomalies
    const anomalyCount = parseResult.parser_metadata?.anomalies?.length || 0;
    if (anomalyCount > 0) {
      warnings.push(`${anomalyCount} anomalies detected in parsing`);
    }
    
    // Check for fallback
    if (parseResult.parser_metadata?.fallback_used) {
      errors.push('Structured parser failed, used AI fallback');
    }
    
    results.push({
      receipt_id: receipt.id,
      passed: errors.length === 0,
      errors,
      warnings,
      metrics: {
        items_matched: actualItemsCount,
        items_expected: receipt.items_count,
        price_accuracy: 100 // TODO: Calculate item-level price accuracy
      }
    });
    
    console.log(`  Result: ${errors.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  return results;
}

async function main() {
  console.log('Starting parser regression tests...\n');
  
  const results = await runRegressionTests();
  
  // Generate report
  const passCount = results.filter(r => r.passed).length;
  const failCount = results.length - passCount;
  
  console.log('\n=== TEST RESULTS ===');
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Pass Rate: ${((passCount / results.length) * 100).toFixed(1)}%\n`);
  
  if (failCount > 0) {
    console.log('FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.receipt_id}`);
      r.errors.forEach(e => console.log(`     - ${e}`));
    });
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
  }
}

main();
```

### 5.3 GitHub Actions Workflow

**File:** `.github/workflows/parser-regression-test.yml`

```yaml
name: Parser Regression Test

on:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger
  pull_request:
    paths:
      - 'supabase/functions/parse-receipt/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run regression tests
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: npx tsx scripts/test-parser-regression.ts
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: regression-test-results
          path: test-results.json
      
      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Parser regression test failed! Check workflow run for details.'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 5.4 Store Test Results

**Add to database:**

```sql
CREATE TABLE parser_test_runs (
  id SERIAL PRIMARY KEY,
  test_date TIMESTAMP DEFAULT NOW(),
  receipts_tested INT NOT NULL,
  passed_count INT NOT NULL,
  failed_count INT NOT NULL,
  pass_rate NUMERIC(5,2),
  parser_version TEXT,
  git_commit TEXT,
  test_results JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_parser_test_runs_test_date ON parser_test_runs(test_date DESC);
```

**Modify test script to store results:**

```typescript
// After running tests, store in database
const { error } = await supabase
  .from('parser_test_runs')
  .insert({
    receipts_tested: results.length,
    passed_count: passCount,
    failed_count: failCount,
    pass_rate: (passCount / results.length) * 100,
    parser_version: 'v2',
    git_commit: process.env.GITHUB_SHA,
    test_results: results
  });
```

---

## Rollout Plan

### Week 1: Foundation
- [ ] Implement Phase 1 (Persistent Debug Storage)
- [ ] Deploy migration for parser_metadata column
- [ ] Update parse-receipt function to store metadata
- [ ] Test with bulk receipts
- [ ] Monitor storage size impact

### Week 2: Detection & Visibility
- [ ] Implement Phase 2 (Anomaly Detection)
- [ ] Test anomaly detection rules
- [ ] Create database views for Phase 3
- [ ] Build ParserHealthDashboard component
- [ ] Add dashboard to Admin page

### Week 3: Monitoring
- [ ] Implement Phase 4 (Alerting)
- [ ] Create parser_alerts table
- [ ] Deploy monitor-parser-health Edge Function
- [ ] Set up cron schedule
- [ ] Build NotificationBell component
- [ ] Test alert generation

### Week 4+: Regression Testing (Optional)
- [ ] Create golden receipt set (Phase 5)
- [ ] Write regression test script
- [ ] Set up GitHub Actions workflow
- [ ] Run initial baseline test
- [ ] Monitor daily test results

---

## Success Metrics

After full implementation, we should be able to:

1. **Track Quality Trends**
   - View parser success rate over time
   - Identify degrading accuracy before users notice
   - Measure impact of parser improvements

2. **Detect Issues Automatically**
   - Catch absurd unit prices (like the 0.66 kr/st bug)
   - Alert when fallback rate spikes
   - Flag receipts for manual review

3. **Improve Continuously**
   - Learn from anomalies
   - Build test cases from real failures
   - Prevent regressions with automated tests

4. **Reduce Manual Work**
   - Less time debugging parser issues
   - Faster root cause identification
   - Proactive fixes before users complain

---

## Cost Estimation

### Storage Costs
- `parser_metadata` per receipt: ~2-5 KB
- 1000 receipts/month: ~5 MB/month
- Negligible cost (< $0.01/month)

### Compute Costs
- Monitor function runs hourly: 720 times/month
- Each run: ~100ms, minimal queries
- Estimated: < $0.10/month

### Development Time
- Phase 1-3: 6-9 hours
- Phase 4: 2-3 hours
- Phase 5: 4-6 hours
- **Total: 12-18 hours**

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review parser alerts
- Check anomaly trends
- Acknowledge resolved alerts

**Monthly:**
- Analyze parser health metrics
- Update anomaly detection thresholds if needed
- Review golden receipt set coverage

**Quarterly:**
- Add new receipts to golden set
- Update test expectations
- Review and archive old alerts

### Monitoring

**Key Metrics to Watch:**
- Parser health score (target: > 90%)
- Anomaly rate (target: < 5%)
- Fallback rate (target: < 10%)
- Average parsing time (target: < 5s)
- Test pass rate (target: 100%)

---

## Future Enhancements

### Phase 6: ML-Based Anomaly Detection (Long-term)
- Train model on historical parsing data
- Detect novel anomaly patterns
- Predict parsing success before attempting

### Phase 7: User-Reported Issues Integration
- "Report Issue" button on receipt view
- Link user reports to parser anomalies
- Track parser fixes → user satisfaction correlation

### Phase 8: A/B Testing Infrastructure
- Test new parser versions on subset of users
- Compare accuracy metrics
- Gradual rollout based on performance

---

## References

- Parser code: `supabase/functions/parse-receipt/index.ts`
- Bug report (Sunny Soda): `TODO.md` line 66-71
- Code review: `.agents/active/fix-structured-parser-merge/review.md`
- Bulk tester: `src/components/training/BulkTester.tsx`
- Existing tables: `supabase/migrations/`

---

**Document Status:** Complete - Ready for Implementation  
**Last Updated:** 2026-02-07  
**Next Review:** After Phase 1 implementation
