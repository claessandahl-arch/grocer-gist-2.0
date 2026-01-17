# Price Comparison Feature

**Last Updated:** 2026-01-17  
**Status:** Active ✅  
**Route:** `/price-comparison`

---

## Overview

The Price Comparison page (`/price-comparison`) allows users to compare prices across products and stores. It aggregates purchase history to show the best prices, helping users identify which stores offer the best value for specific products.

### Key Features

- **Product Search & Filtering** — Real-time search to find specific products
- **Unit Price Comparison** — Compare prices per kg, L, or st (unit)
- **Store Identification** — Shows which store has the best price for each product
- **Price History** — Click any product card to see detailed purchase history
- **Visual Indicators** — Icons for comparison units (⚖️ kg, 💧 L, 📦 st)

---

## How It Works

### Data Flow

```
1. User uploads receipts via /upload
   └─ Items parsed with prices, quantities, unit info

2. Products normalized via Product Management
   └─ "Coca-Cola 1.5L" → "Coca-cola" (mapped_name)

3. view_price_comparison aggregates data
   ├─ Groups by mapped_name + quantity_unit
   ├─ Calculates min/avg/max price per unit
   └─ Identifies best store per product

4. PriceComparison.tsx displays cards
   ├─ Shows product name, best price, store
   ├─ Search filter for finding products
   └─ Click to view price history sheet
```

### Database View

The feature uses `view_price_comparison` (see [enhanced migration](file:///Users/csandahl/Projects/grocer-gist-2.0/supabase/migrations/20260106004600_enhanced_price_comparison_view.sql)):

**Columns returned:**
| Column | Description |
|--------|-------------|
| `mapped_name` | Normalized product name |
| `category` | Product category |
| `quantity_unit` | Comparison unit (kg, L, st) |
| `min_price_per_unit` | Lowest recorded price |
| `avg_price_per_unit` | Average price |
| `max_price_per_unit` | Highest recorded price |
| `best_store_name` | Store with best price |
| `data_points` | Number of purchases |
| `missing_expected_unit_data` | Flag if unit data missing |

### Search Filter

The search filter works client-side on the fetched data:

```typescript
const [searchTerm, setSearchTerm] = useState('');

const filteredItems = items?.filter(item =>
  item.mapped_name.toLowerCase().includes(searchTerm.toLowerCase())
);
```

Users can search for any product by typing in the search input. The filter is case-insensitive and matches partial names.

---

## Known Issues & Fixes

### Search Filter Bug (Fixed 2026-01-17)

**Symptom:** Typing in search showed the correct `filteredItems` count in React state, but the UI continued to display all products instead of only matching ones.

**Root Cause:** The database view returned **duplicate rows** for products with the same `mapped_name` + `quantity_unit` combination. This caused:

1. **Duplicate React Keys** — Keys like `"Coca-cola-st"` appeared multiple times
2. **React Reconciliation Failure** — React lost track of which DOM nodes to unmount
3. **Orphaned DOM Elements** — Cards remained visible even when filtered out of state

**Data Evidence:**
- 490 total items from view
- Only 53 unique product names
- Multiple duplicates: Coca-cola (2x), Päron Conference (3x), Broccoli (3x)

**Fix Applied:** Changed React key to include array index for uniqueness:

```diff
// PriceComparison.tsx line 99-101
-key={`${item.mapped_name}-${item.quantity_unit}`}
+key={`item-${index}-${item.mapped_name}-${item.quantity_unit}`}
```

**Why This Happened:** The search likely worked previously when there were fewer products or no duplicates in the data. As more receipts were uploaded with duplicate product entries, the duplicate key issue emerged.

> [!NOTE]  
> A future optimization should fix the SQL view to properly deduplicate results. The current fix ensures correct UI behavior regardless of data duplicates.

---

## Component Structure

### PriceComparison.tsx

**Location:** [src/pages/PriceComparison.tsx](file:///Users/csandahl/Projects/grocer-gist-2.0/src/pages/PriceComparison.tsx)

**State:**
- `searchTerm` — Current search input value
- `selectedProduct` — Product selected for history view

**Data Fetching:**
```typescript
const { data: items, isLoading } = useQuery({
  queryKey: ['price-comparison', date],
  queryFn: async () => {
    const { data } = await supabase
      .from('view_price_comparison')
      .select('*');
    return data;
  },
});
```

**Key Components:**
- `Input` — Search field with debounced input
- `Card` — Product cards showing price info
- `PriceHistorySheet` — Modal with detailed purchase history

### PriceHistorySheet.tsx

**Location:** [src/components/PriceHistorySheet.tsx](file:///Users/csandahl/Projects/grocer-gist-2.0/src/components/PriceHistorySheet.tsx)

Shows detailed price history when a product card is clicked:
- Price trend over time
- Store comparison chart
- Individual purchase records

---

## Unit Comparison System

Products are compared using appropriate units based on category:

| Category | Unit | Example |
|----------|------|---------|
| `drycker` | kr/L | Coca-Cola → 14.99 kr/L |
| `frukt_och_gront` | kr/kg | Bananer → 39.90 kr/kg |
| `kott_fagel_chark` | kr/kg | Köttfärs → 99.88 kr/kg |
| `mejeri` | kr/st | Yoghurt → 32.00 kr/st |
| Others | kr/st | Default |

**Visual Indicators:**
- ⚖️ — Weight-based (kr/kg)
- 💧 — Volume-based (kr/L)
- 📦 — Per-unit (kr/st)
- ⚠️ — Missing expected unit data

See [PRICE_COMPARISON_ENHANCEMENT.md](file:///Users/csandahl/Projects/grocer-gist-2.0/docs/PRICE_COMPARISON_ENHANCEMENT.md) for implementation details.

---

## Related Files

| File | Purpose |
|------|---------|
| `src/pages/PriceComparison.tsx` | Main page component |
| `src/components/PriceHistorySheet.tsx` | Price history modal |
| `src/lib/comparisonUnits.ts` | Category→unit mapping |
| `supabase/migrations/20260106004600_*.sql` | Database view |
| `docs/PRICE_COMPARISON_ENHANCEMENT.md` | Unit normalization docs |

---

## Future Improvements

1. **Deduplicate Database View** — Fix SQL to prevent duplicate rows
2. **Unit Toggle** — Let users switch between kr/st and kr/kg views
3. **Admin Override** — UI to manually set product unit info
4. **Price Alerts** — Notify users when prices drop

---

## Version History

| Date | Change |
|------|--------|
| 2026-01-17 | Fixed search filter bug (duplicate React keys) |
| 2026-01-06 | Added unit-aware price comparison (Phases 1-2) |
| Initial | Basic price comparison functionality |
