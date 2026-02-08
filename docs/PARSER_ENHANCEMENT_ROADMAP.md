# Parser System Enhancement Roadmap

**Current Status:** Phase 1-3 Complete (Core Detection & Dashboard).
**Next Steps:** Proactive Monitoring, Automation, and Developer Tools.

This document outlines the remaining features and enhancements required to make the Parser Anomaly Detection System fully autonomous and integrated into the development workflow.

---

## 1. Proactive Alerting (Phase 4)
**Goal:** Notify admins immediately when parser health degrades, rather than waiting for manual checks.

### Features
*   **Monitor Edge Function:** Create `monitor-parser-health` function to run hourly via cron.
    *   Logic: Check last hour's receipts.
    *   Trigger: If >10% have anomalies OR >30% used fallback (AI).
*   **Notification System:**
    *   **In-App:** Add a notification bell in the header for admins.
    *   **External:** Send critical alerts (e.g., "0 items found") via Email/Slack.

### Implementation Tasks
- [ ] Create `monitor-parser-health` Edge Function.
- [ ] Set up Supabase Cron to run hourly.
- [ ] Create `parser_alerts` table.
- [ ] Build `NotificationBell` component.

---

## 2. Bulk Tester Integration (High Value / Low Effort)
**Goal:** Surface parser anomalies directly during development testing.

### Features
*   **UI Update:** Update `BulkTester.tsx` to read `parser_metadata` from the response.
*   **Visual Indicator:** Display a ⚠️ warning badge next to any file where the parser detected an anomaly (e.g., "High Qty", "Absurd Price").
*   **Drill-down:** Clicking the warning shows the specific anomaly details.

### Implementation Tasks
- [ ] Update `parse-receipt` to return `parser_metadata` in `comparison` mode response.
- [ ] Update `BulkTester.tsx` to display anomaly warnings.

---

## 3. Automated Regression Testing (Phase 5)
**Goal:** Prevent regression bugs (like the "Sunny Soda" qty=52 bug) from reaching production.

### Features
*   **Golden Set:** Curate a folder of ~20 "perfect" PDFs (Willys, ICA, Coop, tricky cases).
*   **CI/CD Pipeline:** Create a GitHub Action that runs daily.
*   **Guardrails:** Block PRs if parser accuracy drops below 98%.

### Implementation Tasks
- [ ] Create `test-receipts/golden-set/` directory.
- [ ] Create `scripts/test-parser-regression.ts`.
- [ ] Configure GitHub Action workflow.

---

## 4. "Corrupt Categories" Cleanup Tool
**Goal:** Fix data quality issues caused by legacy or English category keys.

### Features
*   **Diagnostic Tool:** Identify products with invalid keys (e.g., `fruits_vegetables` instead of `frukt_och_gront`).
*   **Auto-Fix:** Button to migrate invalid keys to canonical Swedish keys.
*   **Status:** UI placeholder exists in `Diagnostics.tsx` ("Kommer snart").

### Implementation Tasks
- [ ] Migrate logic from legacy `DiagnosticTool` (if available) or write new query.
- [ ] Implement `fix-categories` Edge Function.
- [ ] Connect UI button in `Diagnostics.tsx`.

---

## 5. Configurable Thresholds
**Goal:** Allow tuning of anomaly detection sensitivity without code deployment.

### Features
*   **System Settings:** Move hardcoded values (e.g., `0.50 kr` threshold) to a database table.
*   **Admin UI:** Simple form to adjust thresholds.

### Implementation Tasks
- [ ] Create `system_settings` table.
- [ ] Update `detectAnomalies` to fetch settings (cached).
- [ ] Build settings UI in Admin panel.

---

## Prioritized Plan
1.  **Bulk Tester Integration** (Immediate dev benefit)
2.  **Corrupt Categories Tool** (Data hygiene)
3.  **Proactive Alerting** (Production monitoring)
4.  **Automated Regression Testing** (Long-term stability)
5.  **Configurable Thresholds** (Optimization)
