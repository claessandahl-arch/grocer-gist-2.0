import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle, Zap, Brain, Clock } from "lucide-react";
import { categoryNames } from "@/lib/categoryConstants";

interface ParsedItem {
  name: string;
  price: number;
  quantity: number;
  category: string;
  discount?: number;
}

interface ItemDiff {
  structuredItem?: ParsedItem;
  aiItem?: ParsedItem;
  matchType: 'exact' | 'name_match' | 'fuzzy' | 'price_match' | 'unmatched_structured' | 'unmatched_ai';
  differences: {
    field: 'name' | 'price' | 'quantity' | 'category' | 'discount';
    structured: any;
    ai: any;
  }[];
}

interface ComparisonResult {
  mode: 'comparison';
  structured: {
    store_name: string;
    total_amount: number;
    receipt_date: string;
    items: ParsedItem[];
    method: 'structured_parser';
    timing: number;
  } | null;
  ai: {
    store_name: string;
    total_amount: number;
    receipt_date: string;
    items: ParsedItem[];
    method: 'ai_parser';
    timing: number;
  };
  diff: {
    storeName: { structured: string | null; ai: string; match: boolean };
    totalAmount: { structured: number | null; ai: number; diff: number | null };
    receiptDate: { structured: string | null; ai: string; match: boolean };
    itemCount: { structured: number; ai: number };
    items: ItemDiff[];
    matchRate: number;
    priceAccuracy: number;
  };
  _debug: {
    debugLog: string[];
  };
}

interface ComparisonViewProps {
  result: ComparisonResult;
  parseTime: number | null;
}

function MatchBadge({ type }: { type: ItemDiff['matchType'] }) {
  switch (type) {
    case 'exact':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Exakt</Badge>;
    case 'name_match':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Namn</Badge>;
    case 'fuzzy':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Fuzzy</Badge>;
    case 'price_match':
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pris</Badge>;
    case 'unmatched_structured':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Endast Strukt.</Badge>;
    case 'unmatched_ai':
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Endast AI</Badge>;
  }
}

export function ComparisonView({ result, parseTime }: ComparisonViewProps) {
  const { structured, ai, diff } = result;
  
  const matchedItems = diff.items.filter(d => 
    d.matchType === 'exact' || d.matchType === 'name_match' || d.matchType === 'fuzzy' || d.matchType === 'price_match'
  );
  const unmatchedStructured = diff.items.filter(d => d.matchType === 'unmatched_structured');
  const unmatchedAI = diff.items.filter(d => d.matchType === 'unmatched_ai');

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="bg-slate-50 dark:bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Sammanfattning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Zap className="h-3 w-3" />
                <span>Strukturerad</span>
              </div>
              <span className="font-bold text-lg">{diff.itemCount.structured}</span>
              <span className="text-xs text-muted-foreground">
                {structured?.timing ? `${(structured.timing / 1000).toFixed(2)}s` : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Brain className="h-3 w-3" />
                <span>AI</span>
              </div>
              <span className="font-bold text-lg">{diff.itemCount.ai}</span>
              <span className="text-xs text-muted-foreground">
                {ai?.timing ? `${(ai.timing / 1000).toFixed(2)}s` : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-lg">
              <span className="text-muted-foreground mb-1">Matchning</span>
              <span className={`font-bold text-lg ${diff.matchRate >= 90 ? 'text-green-600' : diff.matchRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                {diff.matchRate}%
              </span>
              <span className="text-xs text-muted-foreground">{matchedItems.length} av {diff.itemCount.ai}</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-lg">
              <span className="text-muted-foreground mb-1">Prisexakthet</span>
              <span className={`font-bold text-lg ${diff.priceAccuracy >= 90 ? 'text-green-600' : diff.priceAccuracy >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                {diff.priceAccuracy}%
              </span>
              <span className="text-xs text-muted-foreground">inom 0.10 kr</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Header</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Fält</th>
                  <th className="text-left py-2 font-medium">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Strukturerad
                    </div>
                  </th>
                  <th className="text-left py-2 font-medium">
                    <div className="flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      AI
                    </div>
                  </th>
                  <th className="text-center py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Butik</td>
                  <td className="py-2">{diff.storeName.structured || '—'}</td>
                  <td className="py-2">{diff.storeName.ai}</td>
                  <td className="py-2 text-center">
                    {diff.storeName.match ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500 inline" />
                    )}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Total</td>
                  <td className="py-2">{diff.totalAmount.structured?.toFixed(2) || '—'} kr</td>
                  <td className="py-2">{diff.totalAmount.ai.toFixed(2)} kr</td>
                  <td className="py-2 text-center">
                    {diff.totalAmount.diff !== null && Math.abs(diff.totalAmount.diff) < 1 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                    ) : diff.totalAmount.diff !== null ? (
                      <span className="text-xs text-orange-600">Δ {diff.totalAmount.diff > 0 ? '+' : ''}{diff.totalAmount.diff.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">Datum</td>
                  <td className="py-2">{diff.receiptDate.structured || '—'}</td>
                  <td className="py-2">{diff.receiptDate.ai}</td>
                  <td className="py-2 text-center">
                    {diff.receiptDate.match ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500 inline" />
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Matched Items */}
      {matchedItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Matchade produkter ({matchedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {matchedItems.map((item, idx) => (
                <div key={idx} className="p-2 bg-muted/50 rounded text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <MatchBadge type={item.matchType} />
                        {item.differences.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {item.differences.map(d => d.field).join(', ')} skiljer sig
                          </span>
                        )}
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Strukt:</span>{' '}
                          <span className={item.differences.some(d => d.field === 'name') ? 'text-yellow-600' : ''}>
                            {item.structuredItem?.name}
                          </span>
                          <span className="ml-2 font-medium">
                            {item.structuredItem?.price.toFixed(2)} kr
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">AI:</span>{' '}
                          <span className={item.differences.some(d => d.field === 'name') ? 'text-yellow-600' : ''}>
                            {item.aiItem?.name}
                          </span>
                          <span className="ml-2 font-medium">
                            {item.aiItem?.price.toFixed(2)} kr
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unmatched Structured Items */}
      {unmatchedStructured.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Endast i Strukturerad ({unmatchedStructured.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {unmatchedStructured.map((item, idx) => (
                <div key={idx} className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm flex justify-between">
                  <span>{item.structuredItem?.name}</span>
                  <span className="font-medium">{item.structuredItem?.price.toFixed(2)} kr</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unmatched AI Items */}
      {unmatchedAI.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-purple-500" />
              Endast i AI ({unmatchedAI.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {unmatchedAI.map((item, idx) => (
                <div key={idx} className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-sm flex justify-between">
                  <span>{item.aiItem?.name}</span>
                  <span className="font-medium">{item.aiItem?.price.toFixed(2)} kr</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Log */}
      {result._debug?.debugLog && result._debug.debugLog.length > 0 && (
        <>
          <Separator />
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
              Debug-logg ({result._debug.debugLog.length} rader)
            </summary>
            <div className="mt-2 p-3 bg-slate-900 rounded text-slate-100 text-xs overflow-x-auto max-h-60 overflow-y-auto font-mono">
              {result._debug.debugLog.map((line, idx) => {
                let className = '';
                if (line.startsWith('✓')) className = 'text-green-400';
                else if (line.startsWith('✗')) className = 'text-red-400';
                else if (line.startsWith('→')) className = 'text-blue-400';
                else if (line.startsWith('---')) className = 'text-yellow-400 font-bold';
                
                return (
                  <div key={idx} className={className}>
                    {line}
                  </div>
                );
              })}
            </div>
          </details>
        </>
      )}
    </div>
  );
}
