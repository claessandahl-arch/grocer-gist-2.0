# Architecture & Technical Reference

## Core Data Flow

1. **Receipt Upload** (`/upload`): Users upload images or PDFs of grocery receipts
   - PDFs are converted to JPG images client-side using `pdfjs-dist` (scale: 2.0, quality: 0.9)
   - Multi-page PDFs are split into individual pages
   - Files are sanitized (removing Swedish characters: å→a, ä→a, ö→o) before uploading to Supabase Storage
   - Duplicate detection checks (date + amount + fuzzy store name match)

2. **AI Parsing**: Images are sent to the `parse-receipt` Supabase Edge Function
   - Uses `gemini-2.5-flash` via direct Google Gemini API
   - **New**: Supports direct PDF text extraction (if PDF URL provided) for 100% accuracy
   - **New**: Enhanced Swedish abbreviation handling (st, kg, pant, rabatt)
   - Applies learned patterns from `store_patterns` table for improved accuracy
   - Extracts: store name, total amount, date, and itemized list with categories
   - Handles multi-line product names and discount parsing
   - Multi-page receipts are combined into a single parsed receipt
   - Error handling for rate limits (429) and credit depletion (402)

3. **Training System** (`/training`): Manual correction interface to improve parsing accuracy
   - Users can review and correct AI-parsed receipts
   - Corrections are saved to `receipt_corrections` table
   - Updates `store_patterns` table with learned categorizations
   - The AI parser uses these patterns to improve future parsing for similar stores
   - Includes ProductMerge component for consolidating duplicate product names
   - Includes AICategorization component for AI-assisted category suggestions

4. **Dashboard** (`/dashboard`): Analytics and insights
   - Monthly spending summaries with navigation between months
   - Server-side aggregated views for optimal performance
   - Category breakdowns using recharts (pie/bar charts)
   - Store comparisons with visit counts
   - Uses corrected categories based on priority system

5. **Product Management** (`/product-management`): Product grouping and merging
   - Ungrouped products list with occurrence counts
   - Product groups list showing merged products
   - Auto-grouping feature using AI (suggest-product-groups Edge Function)
   - User-specific mappings (`product_mappings` table)
   - Global mappings (`global_product_mappings` table) - seeded with 115+ common Swedish products
   - Ignored merge suggestions tracking

6. **Price Comparison** (`/price-comparison`): Unit price analysis
   - Uses `view_price_comparison` for unit price calculations
   - Extracts unit info from product names (kg, g, l, ml, st, etc.)
   - Normalizes units (g→kg, ml→l, pack→st)
   - Shows min/avg/max price per unit
   - Identifies best store for each product

7. **Data Management** (`/datamanagement`): Bulk editing
   - Product search and filtering
   - Category assignment for products
   - Both user and global mapping management
   - Stats showing total products, categorized, uncategorized

## Database Schema (Supabase)

**Core Tables:**

1. **receipts** - Main receipt data
   - Columns: `id`, `user_id`, `image_url`, `image_urls` (array for multi-page), `store_name`, `total_amount`, `receipt_date`
   - `items` (JSONB) - array of {name, price, quantity, category, discount?}
   - RLS policies: users can CRUD their own receipts

2. **receipt_corrections** - Training data for AI improvement
   - Tracks manual corrections for AI training
   - Columns: `id`, `receipt_id`, `user_id`, `original_data`, `corrected_data`, `correction_notes`
   - RLS policies: users can CRUD their own corrections

3. **store_patterns** - Learned item categorization patterns
   - Used by parse-receipt function to improve accuracy
   - Columns: `id`, `store_name`, `pattern_data` (JSONB), `success_rate`, `usage_count`
   - Public read access (anyone can view patterns)

4. **product_mappings** - User-specific product grouping
   - Columns: `id`, `user_id`, `original_name`, `mapped_name`, `category`
   - `quantity_amount`, `quantity_unit` (for price comparison)
   - RLS policies: users can CRUD their own mappings

5. **global_product_mappings** - Shared product mappings
   - Seeded with 115+ common Swedish products
   - Columns: `id`, `original_name`, `mapped_name`, `category`, `usage_count`
   - `quantity_amount`, `quantity_unit`
   - No user_id (global for all users)

6. **user_global_overrides** - User-specific overrides for global mappings
   - Allows users to customize global mapping categories locally
   - Columns: `id`, `user_id`, `global_mapping_id`, `override_category`

7. **ignored_merge_suggestions** - Tracks dismissed product merge suggestions
   - Prevents showing ignored suggestions repeatedly
   - Columns: `id`, `user_id`, `products` (array)

8. **category_suggestion_feedback** - Tracks AI category suggestion feedback
   - Used for improving future AI suggestions
   - Columns: `id`, `user_id`, `product_name`, `suggested_category`, `accepted`

9. **global_mapping_changes** - Audit log for global mapping modifications
   - Tracks who changed what and when
   - Columns: `id`, `mapping_id`, `changed_by`, `change_type`, `old_value`, `new_value`

**Database Views (Server-side Aggregation):**

1. **view_monthly_stats** - Monthly aggregated statistics per user
   - Columns: `user_id`, `year_month`, `total_spend`, `receipt_count`, `avg_per_receipt`
   - Improves dashboard performance by pre-calculating totals

2. **view_category_breakdown** - Spending by category per month with corrected categories
   - Applies category correction priority: user mappings > global mappings > receipt category > 'other'
   - Columns: `user_id`, `year_month`, `category`, `total_spend`, `item_count`

3. **view_store_comparison** - Spending by store per month
   - Columns: `user_id`, `year_month`, `store_name`, `total_spend`, `receipt_count`, `avg_per_visit`

4. **view_price_comparison** - Unit price comparison across products and stores
   - Uses `extract_unit_info()` function for quantity normalization
   - Columns: `user_id`, `mapped_name`, `store_name`, `min_price_per_unit`, `avg_price_per_unit`, `max_price_per_unit`, `purchase_count`

**Database Functions:**

- `extract_unit_info(product_name TEXT)` - Extracts quantity and unit from product names
  - Returns: `{amount: NUMERIC, unit: TEXT}`
  - Handles: kg, g, l, ml, st, pack, etc.
  - Normalizes units (g→kg, ml→l)

- `update_updated_at_column()` - Trigger function for automatic timestamp updates
  - Sets `updated_at = NOW()` on row updates

## Key Technical Patterns

**Category System**: Product categories are defined in `src/lib/categoryConstants.ts` with Swedish labels:
- Uses constant keys (e.g., `CATEGORY_KEYS.FRUKT_OCH_GRONT`)
- Provides display names via `categoryNames` mapping
- Exports `categories` array and `categoryOptions` for form selects
- Always use these constants instead of hardcoding category values
- 14 total categories covering all grocery items

**Category Correction System**:
The application uses a sophisticated category correction priority system to ensure accurate analytics:
1. **User mappings** (`product_mappings.category`) - User's explicit categorization
2. **Global mappings** (`global_product_mappings.category`) - Shared product database
3. **Receipt category** - AI-parsed from receipt
4. **Fallback** - 'other' category

**Receipt Items Structure**:
```typescript
interface ReceiptItem {
  name: string;
  price: number;       // Final price after discount
  quantity: number;
  category: string;    // One of the CATEGORY_KEYS
  discount?: number;   // Optional discount amount (positive number)
}
```

**Discount Handling**: The AI parser is specifically trained to:
- Combine multi-line product names (e.g., "Juicy Melba" + "Nocco" on next line)
- Never create items with negative prices
- Apply discount lines to the product above them
- Store the final price and discount separately

**Multi-page Receipt Handling**:
- Multiple images are automatically detected and grouped during upload
- PDFs converted page-by-page with scale: 2.0, quality: 0.9
- All pages uploaded to storage with sequential numbering
- The AI receives all image URLs in page order
- Receipt record stores both `image_url` (first page) and `image_urls` (all pages array)
- Edge function accepts `imageUrls` array (preferred) or legacy `imageUrl`

**Duplicate Detection**: When uploading receipts, the system checks for duplicates by:
- Matching `receipt_date` and `total_amount`
- Fuzzy matching store names (handles variations like "ICA" vs "ICA Nära")

## Supabase Edge Functions

Location: `supabase/functions/`

### 1. parse-receipt
**Purpose:** Parse receipt images and PDFs using hybrid approach (PDF text extraction + AI vision)
**Input:** `imageUrls` (array), `pdfUrl` (optional), `originalFilename` (optional)
**Processing Strategy:**
1. PDF Text Extraction (via `pdf-parse`)
2. Structured Parser (for ICA detailed/kvitto formats)
3. AI Vision Fallback (Gemini 2.5 Flash)

### 2. suggest-categories
**Purpose:** AI-assisted category suggestions using feedback loop.
**Process:** Fetches training data -> Builds prompt -> Calls Gemini -> Returns suggestions with confidence.

### 3. suggest-product-groups
**Purpose:** AI-assisted product grouping within categories.
**Process:** Analyzes products -> Groups variants -> Weights by occurrence.

### 4. cleanup-categories
**Purpose:** Scan and fix invalid/corrupted category keys.

## Performance Optimizations

1. **Code Splitting**: All routes are lazy loaded using React.lazy()
2. **Virtualization**: ProductMerge uses react-window (v2.2.3) for large lists
3. **Server-side Aggregation**: Dashboard uses database views instead of client-side calculations
4. **Query Caching**: TanStack Query with configurable staleTime and refetchOnMount
5. **Debouncing**: Search inputs use use-debounce (10.0.6)

## Implementation Notes

1. **Path Aliases**: Use `@/` for imports (configured in tsconfig.json)
2. **Routing**: All custom routes must be added ABOVE the catch-all `*` route in `App.tsx`
3. **File Sanitization**: Always use the `sanitizeFilename` function when uploading files
4. **Category Consistency**: Always import/use constants from `src/lib/categoryConstants.ts`
5. **Query Client**: Use `useQuery` with appropriate `staleTime` (0 for volatile, 5m for stable)
6. **Styling**: Tailwind CSS with custom theme (`bg-gradient-hero`, `shadow-card`)
7. **UI Components**: shadcn-ui in `src/components/ui/` (do not modify directly)
8. **Date Handling**: `date-fns` with Swedish locale (`sv`)
9. **TypeScript**: Relaxed strictness (`noImplicitAny: false`) - trade-off for speed
10. **Virtualization**: Use `react-window` v2 API (`List`, not `FixedSizeList`)

## Frontend Architecture & Patterns

### Global State Management
- **TanStack Query (React Query)**: Used for server state (queries/mutations).
    - **Keys**: defined in separate query key factory or consistently named.
    - **Stale Time**: 0 for volatile data, 5 minutes for stable data.
- **Local State**: Use `useState` for UI-only state (modals, form inputs).
- **Context API**: Use sparingly for truly global UI settings (e.g., ThemeProvider).

### Component Composition
- **Container/Presenter**: Separate logic (Container) from UI (Presenter) where complex.
- **Shadcn UI**: Use as the base design system. Do not override styles unless necessary.
- **Tailwind CSS**: Use utility classes. Use `cn()` for dynamic class merging.

### Backend Integration Patterns
- **Supabase Client**: Direct client-side calls via `src/integrations/supabase/client.ts`.
- **Edge Function Isolation**: Extract complex logic (like `detectAnomalies`) into pure functions within the handler file to enable unit testing.
