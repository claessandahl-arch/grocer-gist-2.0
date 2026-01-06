# Price Comparison Enhancement

**Created:** 2026-01-06  
**Status:** Phase 1-2 Complete ✅, Phase 3-5 Paused ⏸️  
**Goal:** Intelligent price comparison with kr/kg, kr/L, kr/st based on product category

---

## Overview

The price comparison feature shows the best prices for products across different stores. This enhancement adds **unit-aware comparisons** so products are compared fairly:

| Category | Comparison Unit | Example |
|----------|-----------------|---------|
| Drinks | kr/L | Coca-Cola 1.5L → 14.99 kr/L |
| Fruits & Vegetables | kr/kg | Bananer 500g → 39.90 kr/kg |
| Meat & Fish | kr/kg | Köttfärs 800g → 99.88 kr/kg |
| Dairy (per container) | kr/st | Yoghurt 1kg → 32.00 kr/st |
| Other | kr/st | Default |

---

## Implementation Status

| Phase | Description | Status | PR |
|-------|-------------|--------|-----|
| 1 | Database & Data Model | ✅ Complete | #24 |
| 2 | Structured Parser Unit Extraction | ✅ Complete | #25 |
| 3 | Name Pattern Extractor | ⏸️ Paused | — |
| 4 | Enhanced UI with Unit Toggle | ⏸️ Paused | — |
| 5 | Admin Override View | ⏸️ Paused | — |

> **Note:** Phases 3-5 paused until structured parser is promoted to production.
> See [`docs/STRUCTURED_PARSER_PROMOTION_PLAN.md`](STRUCTURED_PARSER_PROMOTION_PLAN.md)

---

## Phase 1: Database & Data Model ✅

### New Table: `product_unit_info`

Stores per-product unit overrides for future admin functionality.

```sql
-- supabase/migrations/20260106004500_product_unit_info_table.sql
CREATE TABLE product_unit_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  comparison_unit TEXT NOT NULL CHECK (comparison_unit IN ('kg', 'L', 'st')),
  content_amount NUMERIC,
  content_unit TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'parsed', 'ai')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_name)
);
```

### Enhanced View: `view_price_comparison`

Updated to include category-aware unit defaults and normalization.

```sql
-- supabase/migrations/20260106004600_enhanced_price_comparison_view.sql
-- Key logic: determines comparison unit from category
CASE 
  WHEN category IN ('drycker') THEN 'L'
  WHEN category IN ('frukt_och_gront', 'kott_fagel_chark', 'fisk_skaldjur') THEN 'kg'
  ELSE 'st'
END AS expected_comparison_unit
```

### Frontend Helper: `comparisonUnits.ts`

```typescript
// src/lib/comparisonUnits.ts
export const CATEGORY_COMPARISON_UNITS: Record<string, 'kg' | 'L' | 'st'> = {
  'drycker': 'L',
  'frukt_och_gront': 'kg',
  'kott_fagel_chark': 'kg',
  'fisk_skaldjur': 'kg',
  'mejeri': 'st',  // Yoghurt compared per container
  // ... all other categories default to 'st'
};
```

### UI Changes: `PriceComparison.tsx`

Visual indicators added:
- ⚖️ kg — for weight-based comparison
- 💧 L — for volume-based comparison
- 📦 st — for per-unit comparison
- ⚠️ — warning when expected unit data is missing

---

## Phase 2: Structured Parser Unit Extraction ✅

### New Helper: `extractContentInfo()`

Added to `supabase/functions/parse-receipt/index.ts`:

```typescript
function extractContentInfo(productName: string): { 
  amount: number; 
  unit: 'kg' | 'L'; 
  cleanName: string;
} | null {
  // Patterns for Swedish product names
  const patterns = [
    { regex: /(\d+(?:[,.]?\d+)?)\s*kg\b/i, unit: 'kg', divisor: 1 },
    { regex: /(\d+(?:[,.]?\d+)?)\s*g(?:r|ram)?\b/i, unit: 'kg', divisor: 1000 },
    { regex: /(\d+(?:[,.]?\d+)?)\s*l(?:iter)?\b/i, unit: 'L', divisor: 1 },
    { regex: /(\d+(?:[,.]?\d+)?)\s*dl\b/i, unit: 'L', divisor: 10 },
    { regex: /(\d+(?:[,.]?\d+)?)\s*cl\b/i, unit: 'L', divisor: 100 },
    { regex: /(\d+(?:[,.]?\d+)?)\s*ml\b/i, unit: 'L', divisor: 1000 },
  ];
  // ... extracts and normalizes values
}
```

### Examples

| Product Name | Extracted | Normalized |
|--------------|-----------|------------|
| `Coca-Cola 1,5l` | 1.5 | 1.5 L |
| `Chips OLW 275g` | 275 | 0.275 kg |
| `Mjölk 1L` | 1 | 1 L |
| `Nocco 33cl` | 33 | 0.33 L |
| `Köttfärs 800g` | 800 | 0.8 kg |

### Integrated Into Parsers

- `parseWillysReceiptText()` — 3 locations
- `parseICAKvantumText()` — 1 location
- `parseICAReceiptText()` — 2 locations

---

## Phase 3: Name Pattern Extractor (PAUSED)

**Goal:** Frontend fallback for items that weren't parsed with unit info.

Would run in `PriceComparison.tsx` when `content_amount` is NULL:
```typescript
// Try to extract from product name in frontend
const extracted = extractContentFromName(item.product_name);
if (extracted) {
  item.content_amount = extracted.amount;
  item.content_unit = extracted.unit;
}
```

---

## Phase 4: Enhanced UI with Unit Toggle (PAUSED)

**Goal:** Let users switch between kr/st and kr/kg or kr/L views.

Features:
- Toggle button per product card
- Show both original price AND normalized price
- Remember user preference

---

## Phase 5: Admin Override View (PAUSED)

**Goal:** Admin UI to manually set `product_unit_info` entries.

Use cases:
- Fix incorrect auto-detected units
- Set units for products without size in name
- Override category defaults

---

## How It Works (End-to-End)

```
1. Receipt uploaded
   ├─ Structured parser extracts items
   ├─ extractContentInfo() detects package size from name
   └─ content_amount, content_unit saved to items JSON

2. Receipt saved to database
   └─ items column includes unit data when available

3. Price Comparison view queried
   ├─ view_price_comparison joins with product_unit_info
   ├─ Determines expected_comparison_unit from category
   ├─ Calculates normalized_price when data available
   └─ Flags missing_expected_unit_data when should compare by unit but can't

4. Frontend displays
   ├─ Shows unit icon (⚖️ 💧 📦)
   ├─ Shows ⚠️ when data missing
   └─ Uses normalized price for sorting when available
```

---

## Files Modified

### Phase 1

| File | Purpose |
|------|---------|
| `supabase/migrations/20260106004500_product_unit_info_table.sql` | New table |
| `supabase/migrations/20260106004600_enhanced_price_comparison_view.sql` | Enhanced view |
| `src/lib/comparisonUnits.ts` | Category→unit mapping |
| `src/pages/PriceComparison.tsx` | Unit icons in UI |

### Phase 2

| File | Purpose |
|------|---------|
| `supabase/functions/parse-receipt/index.ts` | `extractContentInfo()` helper + integration |

---

## Related Documentation

- [`TODO.md`](../TODO.md) — Project task list with phase status
- [`docs/STRUCTURED_PARSER_PROMOTION_PLAN.md`](STRUCTURED_PARSER_PROMOTION_PLAN.md) — Prerequisite for Phase 3+

---

## Version History

| Date | Change |
|------|--------|
| 2026-01-06 | Phase 1 & 2 completed (PRs #24, #25) |
| 2026-01-06 | Phases 3-5 paused pending parser promotion |
