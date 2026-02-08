# Feature: Admin Tools Enhancement (Bulk Tester & Data Cleanup)

## Description
This feature implements two critical items from the `PARSER_ENHANCEMENT_ROADMAP.md`:
1.  **Bulk Tester Integration**: Enhances the `BulkTester` tool to display parser anomalies (e.g., "High Quantity", "Absurd Price") directly in the test results, allowing developers to spot logic errors faster.
2.  **Corrupt Categories Cleanup**: Activates the "Städverktyg" for corrupt categories in `Diagnostics.tsx`. It introduces a new Edge Function to scan for and fix invalid category keys in `product_mappings` that don't match the canonical `CATEGORY_KEYS`.

## User Story
**As a** Developer/Admin
**I want to** see anomaly warnings in the Bulk Tester and have a tool to fix invalid category data
**So that** I can ensure parser quality and maintain database hygiene without manual SQL queries.

## Files to Create/Modify

### 1. Bulk Tester (Frontend)
*   **Modify:** `src/components/training/BulkTester.tsx`
    *   Update `BulkTestResult` interface to include `anomalies`.
    *   Extract `parser_metadata.anomalies` from `parse-receipt` response.
    *   Visual: Add `AlertTriangle` warning badge to result list rows.
    *   Report: Include anomaly details in the "Download Logs" markdown.

### 2. Category Cleanup (Backend)
*   **Create:** `supabase/functions/cleanup-categories/index.ts`
    *   **Action `scan`**: Finds products where `category` is NOT in `src/lib/categoryConstants.ts`. Returns count and examples.
    *   **Action `fix`**: Updates invalid categories.
        *   Logic: If comma-separated (e.g., "fruit, organic"), keep first valid.
        *   Logic: If unknown, set to `other`.
        *   Logic: Trim whitespace.

### 3. Diagnostics (Frontend)
*   **Modify:** `src/pages/Diagnostics.tsx`
    *   Implement logic for the "Corrupt Categories" card.
    *   Use `useQuery` to call `cleanup-categories` (scan mode).
    *   Use `useMutation` to call `cleanup-categories` (fix mode).

## Step-by-Step Tasks

### Phase 1: Bulk Tester Enhancements
1.  [ ] **Update Types**: Add `anomalies` array to `BulkTestResult` in `BulkTester.tsx`.
2.  [ ] **Logic Update**: In `processReceipt`, capture `data.parser_metadata.anomalies` and store it in the result state.
3.  [ ] **UI Update**:
    *   Add warning icon (orange `AlertTriangle`) to the result row if `anomalies.length > 0`.
    *   Add tooltip to the icon showing the anomaly types (e.g., "High Qty: 52").
4.  [ ] **Report Update**: Update `downloadCombinedLogs` to list anomalies under a new "⚠️ Anomalies" section for each receipt.

### Phase 2: Category Cleanup Function
5.  [ ] **Create Edge Function**: `supabase/functions/cleanup-categories/index.ts`.
    *   Import `CATEGORY_KEYS` (hardcoded or shared).
    *   Implement `scan` logic using raw SQL or Supabase query.
        *   *Note*: Supabase JS client doesn't support "NOT IN array" easily with dynamic arrays, might need specific logic or raw SQL via RPC if complex.
        *   *Simpler Approach*: Fetch ALL mappings with non-null categories (pagination might be needed if >1000, but for now 1000 limit is fine for a tool). Filter in memory (Deno) for valid keys.
    *   Implement `fix` logic:
        *   Iterate through invalid items.
        *   Determine new category.
        *   Perform bulk update (or individual updates).
6.  [ ] **Deploy Function**: `supabase functions deploy cleanup-categories`.

### Phase 3: Diagnostics UI
7.  [ ] **Enable UI**: In `Diagnostics.tsx`, remove "Kommer snart" disabled state.
8.  [ ] **Connect Scan**: Fetch count of invalid categories on load.
9.  [ ] **Connect Fix**: Add "Fix" button that triggers the `fix` action and re-fetches.

## Testing Strategy

*   **Bulk Tester**:
    *   Upload a "bad" receipt (e.g., one with >50 items or free items).
    *   Verify orange warning icon appears.
    *   Verify download report contains the anomaly text.
*   **Category Cleanup**:
    *   Manually insert a bad record in `product_mappings` (e.g., category='invalid_cat').
    *   Run "Scan" in Diagnostics -> should show 1.
    *   Run "Fix" -> should show 0.
    *   Verify record is updated to 'other' or corrected.

## Validation Commands
```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint
npm run lint

# 3. Build
npm run build

# 4. Deploy Function
supabase functions deploy cleanup-categories
```

## Acceptance Criteria
- [ ] `BulkTester` shows visual warning for receipts with anomalies.
- [ ] `BulkTester` log download includes anomaly details.
- [ ] `Diagnostics` page accurately counts products with invalid categories.
- [ ] "Fix" button successfully corrects invalid categories in the database.
