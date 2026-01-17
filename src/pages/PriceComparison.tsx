import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, ArrowLeft, TrendingDown, TrendingUp, Store, Scale, Droplets, Package, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

type PriceComparisonItem = {
  mapped_name: string;
  category: string;
  quantity_unit: 'kg' | 'L' | 'st';
  expected_comparison_unit: 'kg' | 'L' | 'st';
  missing_expected_unit_data: boolean;
  min_price_per_unit: number;
  avg_price_per_unit: number;
  max_price_per_unit: number;
  best_store_name: string;
  data_points: number;
  has_reliable_unit_data: boolean;
};

// Unit badge configuration
const UNIT_CONFIG = {
  kg: { icon: Scale, label: 'kr/kg', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  L: { icon: Droplets, label: 'kr/L', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  st: { icon: Package, label: 'kr/st', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
};

import { PriceHistorySheet } from "@/components/dashboard/PriceHistorySheet";

export default function PriceComparison() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<{ name: string, unit: string } | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['price-comparison', new Date().toISOString().split('T')[0]], // Add date to force daily refresh
    queryFn: async () => {
      const { data, error } = await supabase
        .from('view_price_comparison')
        .select('*')
        .order('data_points', { ascending: false }); // Show most popular items first

      if (error) throw error;
      return data as PriceComparisonItem[];
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });

  // Client-side search filter - case-insensitive partial match on product name
  // This derives filtered list from the full items array on each render
  const filteredItems = items?.filter(item =>
    item.mapped_name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="container mx-auto p-4 space-y-6 max-w-6xl pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Prisjämförelse
          </h1>
          <p className="text-muted-foreground">Hitta bästa priset per enhet för dina varor</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök produkt (t.ex. Kaffe, Smör)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-card/50 backdrop-blur-sm"
        />
      </div>


      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 bg-muted/20 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 
            IMPORTANT: Key includes index to ensure uniqueness.
            The database view may return duplicate mapped_name + quantity_unit combinations.
            Without the index, duplicate React keys cause reconciliation failures
            and the UI won't update correctly when filtering.
            See: docs/PRICE_COMPARISON.md for full explanation.
          */}
          {filteredItems?.map((item, index) => (
            <Card
              key={`item-${index}-${item.mapped_name}-${item.quantity_unit}`}
              className="hover:shadow-md transition-shadow border-l-4 border-l-primary cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => setSelectedProduct({ name: item.mapped_name, unit: item.quantity_unit })}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold">{item.mapped_name}</CardTitle>
                  <div className="flex items-center gap-1">
                    {item.missing_expected_unit_data && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-amber-500">
                            <AlertTriangle className="h-4 w-4" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Saknar enhetsdata för {item.expected_comparison_unit === 'kg' ? 'viktjämförelse' : 'volumjämförelse'}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {(() => {
                      const config = UNIT_CONFIG[item.quantity_unit] || UNIT_CONFIG.st;
                      const Icon = config.icon;
                      return (
                        <Badge className={`font-mono gap-1 ${config.color}`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-3 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    <span className="font-medium truncate max-w-[120px]" title={item.best_store_name}>
                      {item.best_store_name}
                    </span>
                  </div>
                  <span className="text-lg font-bold">
                    {item.min_price_per_unit.toFixed(2)}:-
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex flex-col p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" /> Snittpris
                    </span>
                    <span className="font-medium">{item.avg_price_per_unit.toFixed(2)}:-</span>
                  </div>
                  <div className="flex flex-col p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Maxpris
                    </span>
                    <span className="font-medium">{item.max_price_per_unit.toFixed(2)}:-</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground text-right border-t pt-2 mt-2">
                  Klicka för att se {item.data_points} köp
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredItems?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Inga produkter hittades som matchar din sökning.
            </div>
          )}
        </div>
      )}

      {selectedProduct && (
        <PriceHistorySheet
          isOpen={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
          productName={selectedProduct.name}
          unit={selectedProduct.unit}
        />
      )}
    </div>
  );
}
