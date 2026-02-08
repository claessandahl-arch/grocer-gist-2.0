# Feature: Parser Anomaly Detection System

## Description
Implement a comprehensive system to persist parser debug data, detect anomalies (like absurd unit prices), and visualize parser health. This transforms transient debug logs into actionable insights to prevent regressions and improve parsing quality.

## User Story
**As an** Admin/Developer
**I want to** see a dashboard of parser health and be alerted to anomalies (e.g., Qty 52 instead of 2)
**So that** I can proactively fix parser bugs and maintain high data accuracy for users.

## Files to Create/Modify
1.  **Database**: `supabase/migrations/20260208120000_parser_anomaly_detection.sql` (New)
    *   Adds `parser_metadata` column to `receipts`
    *   Creates views: `parser_anomalies`, `parser_health_metrics`, `anomaly_type_breakdown`
2.  **Backend**: `supabase/functions/parse-receipt/index.ts` (Modify)
    *   Implement anomaly detection logic (unit price sanity, zero items, etc.)
    *   Save `parser_metadata` to database during receipt insertion
3.  **Frontend**: `src/components/admin/ParserHealthDashboard.tsx` (New)
    *   React component to display health score, anomaly stats, and recent issues
4.  **Frontend**: `src/pages/Diagnostics.tsx` (Modify)
    *   Integrate `ParserHealthDashboard` into the Diagnostics page

## Step-by-Step Tasks

### Phase 1: Database Foundation
1.  [ ] Create migration `supabase/migrations/20260208120000_parser_anomaly_detection.sql` containing:
    *   `ALTER TABLE receipts ADD COLUMN parser_metadata JSONB;`
    *   `CREATE INDEX` for anomalies and methods.
    *   Views: `parser_anomalies`, `parser_health_metrics`, `anomaly_type_breakdown`, `store_parser_accuracy`.

### Phase 2: Edge Function Logic
2.  [ ] Update `supabase/functions/parse-receipt/index.ts`:
    *   Define `Anomaly` and `ParserMetadata` interfaces.
    *   Implement `detectAnomalies` function (rules: absurd unit price, high qty, negative price, etc.).
    *   Update `storeStructuredResultToDatabase` (and AI fallback path) to construct and save `parser_metadata`.
    *   Add helper `getDebugLogSummary` to truncate logs for storage.

### Phase 3: Frontend Dashboard
3.  [ ] Create `src/components/admin/ParserHealthDashboard.tsx`:
    *   Fetch data from new views using `useQuery`.
    *   Display "Overall Parser Health" card with score.
    *   Display "Anomaly Types" and "Recent Anomalies" lists.
4.  [ ] Update `src/pages/Diagnostics.tsx`:
    *   Import `ParserHealthDashboard`.
    *   Add a new tab or section "Parser Health" to render the dashboard.

### Phase 4: Validation
5.  [ ] Deploy database migration.
6.  [ ] Deploy `parse-receipt` function.
7.  [ ] Run `test-parser-local.ts` (or upload a receipt) to generate real data.
8.  [ ] Verify `parser_metadata` is populated in `receipts` table.
9.  [ ] Verify Dashboard shows correct metrics.

## Testing Strategy
*   **Unit Test**: Test `detectAnomalies` logic with mock items (e.g., item with 0.66 kr/st unit price).
*   **Integration Test**: Upload a "Golden Receipt" known to be tricky and verify anomalies are captured (or absent if fixed).
*   **UI Test**: Verify Dashboard gracefully handles empty state (no metadata yet).

## Validation Commands
```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint
npm run lint

# 3. Build
npm run build

# 4. Deploy Migration (Local)
supabase db push

# 5. Deploy Function (if testing against remote, otherwise use local serving)
# supabase functions deploy parse-receipt
```

## Acceptance Criteria
*   [ ] `receipts` table has `parser_metadata` populated for new uploads.
*   [ ] Anomaly detection catches "absurd unit price" (< 0.50 kr/st).
*   [ ] Diagnostics page shows Parser Health score and recent anomalies.
*   [ ] No regression in parsing speed (metadata overhead < 50ms).
