# TODO

> **Last session:** 2026-01-17 — Fixed Price Comparison search filter bug (PR #27), added comprehensive documentation (`docs/PRICE_COMPARISON.md`)

## High Priority Fixes 🚨

- [ ] **Fix '2F25' Discount Parsing Logic** (IMPORTANT)
  - **Issue:** `parseICAKvantumText` treats multi-buy offers like "2F25" as simple discounts (subtraction) instead of price overrides.
  - **Impact:** Incorrect prices (e.g., 8.10 kr instead of 25.00 kr) for bundled items.
  - **Plan:** [`docs/PARSER_2F25_DISCOUNT_FIX_PLAN.md`](docs/PARSER_2F25_DISCOUNT_FIX_PLAN.md)

## Fixed Bugs ✅

- [x] **"Sök liknande grupper" timeout fixed** (PR #2)
  - Reduced batch size from 200 → 75 groups to prevent Gemini API timeout
  - Groups sorted by product count to prioritize larger groups

- [x] **"AI-mappa till grupper" returning no suggestions** (PR #19)
  - **Symptom:** Clicking "AI-mappa till grupper" returned "Inga produkter kunde mappas automatiskt" even for obvious matches like SALLADSLÖK → Salladslök
  - **Root cause:** Case-sensitivity mismatch between frontend and Edge Function
    - Frontend used case-**sensitive** check (`m.original_name`)
    - Edge Function used case-**insensitive** check (`toLowerCase()`)
  - **Effect:** Products like "SALLADSLÖK" appeared unmapped in UI when only lowercase "salladslök" mapping existed. Edge Function correctly identified them as mapped and skipped them.
  - **Fix:** Updated `ProductManagement.tsx` to use `toLowerCase()` for mapping lookups
  - **Lesson learned:** Always use case-insensitive matching for product name lookups to handle receipt variations

- [x] **Category key inconsistency (`fruits_vegetables` → `frukt_och_gront`)** (PRs #20, #21)
  - **Symptom:** Categories like `fruits_vegetables`, `dairy` appeared in database but frontend expected `frukt_och_gront`, `mejeri`
  - **Root cause:** Seed migration used English category keys, Edge Functions used inconsistent Swedish keys (`frukt_gront` missing `_och_`)
  - **Fix:**
    1. PR #20: Updated Edge Functions to use canonical Swedish keys from `categoryConstants.ts`
    2. PR #21: Database migration to convert all English keys to Swedish
  - **meat_fish split:** Lax/Laxfilé → `fisk_skaldjur`, all meat → `kott_fagel_chark`

- [x] **Price Comparison search filter not updating UI** (PR #27)
  - **Symptom:** Typing in search showed correct `filteredItems` count in React state, but UI displayed 60+ products instead of matching ones
  - **Root cause:** Duplicate React keys from database duplicates caused reconciliation failures
    - `view_price_comparison` returned duplicates (same `mapped_name + quantity_unit`)
    - Keys like `"Coca-cola-st"` appeared multiple times
    - React lost track of DOM nodes → orphaned cards remained visible
  - **Fix:** Added array index to key: `key={item-${index}-...}` for guaranteed uniqueness
  - **Docs:** Created `docs/PRICE_COMPARISON.md` with comprehensive feature documentation

## Security Fixes 🔒

- [ ] **Fix "Security Definer View" warnings** (Supabase Security Advisor)
  - **Issue:** Views executing with owner permissions instead of invoker permissions.
  - **Affected Views:**
    - `public.view_store_comparison`
    - `public.view_price_comparison`
    - `public.view_user_basket`
    - `public.view_monthly_stats`
    - `public.view_store_savings_summary`
    - `public.view_category_breakdown`
    - `public.view_product_store_prices`
    - `public.view_store_recommendations`
  - **Action:** Review and potentially change to `SECURITY INVOKER` or audit permissions.

## Known Bugs 🐛

- [x] **Perceptual hash collision causes false duplicate detection** ✅ FIXED (2026-02-08)
  - **Fix:** Added `receipt_date` to `receipt_image_hashes` table and updated unique constraint.
  - **Logic:** Allows same visual hash if dates are different (extracted from filename).
  - **Docs:** `docs/HASH_COLLISION_FIX_PLAN.md` (Option A implemented).

- [ ] **Orphan hashes block re-upload after receipt deletion**
  - **Symptom:** Deleting a receipt then re-uploading the same PDF shows "Duplikat upptäckt"
  - **Root cause:** Hash rows with `receipt_id = NULL` (orphans from failed uploads) are not cleaned up by `ON DELETE CASCADE` since there's no `receipt_id` to cascade from. Also, deletion in Training.tsx relies solely on CASCADE — no explicit hash cleanup.
  - **Workaround:** Run in Supabase SQL Editor: `DELETE FROM receipt_image_hashes WHERE receipt_id IS NULL;`
  - **Proper fix:** Add explicit hash deletion in Training.tsx delete handlers (both single and bulk) before deleting the receipt, and add a cleanup sweep for orphan hashes on upload.

- [ ] **Receipt images on old storage**
  - Images still point to old Lovable Storage URLs
  - Will work until that bucket is deleted
  - Consider migrating images to new storage bucket

- [x] **Structured parser item merge error** ✅ FIXED (2026-02-07, PR #34)
  - **Receipt:** `ICA Kvantum Kungens Kurva 2026-02-05`
  - **Symptom:** Item "Sunny Soda Nocco2F38" showed 52 st × 34.1 kr = 0.66:-/st
  - **Expected:** Should be 2 st × 19,05 kr based on receipt table
  - **Root cause:** Parser regex captured merged digits from `,052,00` (price+quantity) → extracted qty=52
  - **Fix:** Added unit price sanity check: if `impliedUnitPrice < 1 kr`, fallback to qty=1
  - **Limitation:** Fix prevents absurd prices but uses qty=1 fallback (not perfect qty=2)
  - **Docs:** `.agents/active/fix-structured-parser-merge/` (plan, execution, code review)

- [x] **Admin Tools Enhancement** ✅ FIXED (2026-02-08, PR #37)
  - **Goal:** Improve parser quality monitoring and database hygiene
  - **Features:**
    - [x] **Bulk Tester Integration:** Visualizes parser anomalies (e.g., "High Qty") directly in test results.
    - [x] **Corrupt Categories Tool:** "Städverktyg" in Diagnostics page to scan and fix invalid category keys.
  - **Impact:** Immediate visibility of parser regressions and one-click database cleanup.
  - **Docs:** [`docs/PARSER_ENHANCEMENT_ROADMAP.md`](docs/PARSER_ENHANCEMENT_ROADMAP.md)

---

## Parser Quality & Monitoring 🔍

- [x] **Parser Anomaly Detection System** ✅ FIXED (2026-02-08, PR #36)
  - **Goal:** Automatically detect and alert on parser issues before users notice
  - **Implementation Plan:** [`docs/parser-anomaly-detection-system.md`](docs/parser-anomaly-detection-system.md)
  - **Phases:**
    1. [x] Persistent debug storage (parser_metadata in receipts table)
    2. [x] Automated anomaly detection (absurd prices, high quantities, etc.)
    3. [x] Admin dashboard (parser health score, recent anomalies)
    4. [ ] Proactive alerting (in-app notifications when quality degrades)
    5. [ ] Continuous regression testing (golden receipt set, daily automated tests)
  - **Estimated Effort:** 12-18 hours
  - **Priority:** Medium (implement after current feature work)
  - **Benefit:** Catch bugs like the "Sunny Soda qty=52" automatically

---

## Performance Optimizations ⚡

- [x] **Removed debug console.log statements** (PR #22) ⚠️ **REVERTED**
  - Reverted to enable debugging during price comparison development
  - Will re-remove once feature is stable

- [x] **Dashboard TanStack Query caching** (PR #23)
  - Added `staleTime: 5 * 60 * 1000` to `monthly-stats` and `category-breakdown` queries
  - Prevents unnecessary refetches on tab switch or navigation
  - Added cache invalidation after receipt upload so new receipts show immediately

---

## Price Comparison Enhancement 📊

> **Goal:** Intelligent price comparison with kr/kg, kr/L, kr/st based on product category

### Phase 1: Database & Data Model ✅ (PR #24)

- [x] `comparisonUnits.ts` - Category → unit mapping constants
  - Drinks → kr/L, Meat/Fruit → kr/kg, Yoghurt → kr/st
  - Normalization helpers (g→kg, ml/cl/dl→L)
- [x] `product_unit_info` table - Stores unit overrides per product (future admin)
- [x] `view_price_comparison` - Enhanced with category-aware normalization
- [x] Visual indicators in UI (⚖️ kg, 💧 L, 📦 st, ⚠️ missing data)

### Phase 2: Structured Parser Unit Extraction ✅ (PR #25)

- [x] `extractContentInfo()` helper - extracts package sizes from product names
  - `g/gr/gram → kg`, `ml/cl/dl → L`
  - Swedish comma handling (1,5l → 1.5L)
- [x] Integrated into Willys parser (3 locations)
- [x] Integrated into ICA Kvantum parser
- [x] Integrated into ICA Standard parser (2 locations)
- [x] Edge Function deployed to Supabase

### Future Phases (⏸️ PAUSED)

> **Note:** Paused on 2026-01-06. Need to promote structured parser to production first.
> See [`docs/STRUCTURED_PARSER_PROMOTION_PLAN.md`](docs/STRUCTURED_PARSER_PROMOTION_PLAN.md)

- [ ] **Phase 3:** Name pattern extractor (frontend fallback)
- [ ] **Phase 4:** Enhanced UI with unit toggle
- [ ] **Phase 5:** Admin override view

## Future Improvements 🚀

### Minor Cleanup

- [x] ~~Remove console.log statements~~ → Completed in PR #22
- [ ] Add TypeScript types for database views (currently using `any`)

### Structured Parsing (January 2026)

- [x] **ICA Kvantum structured parser** - Fixed! Now supports ICA Kvantum, Nära, Maxi, Supermarket with 94% pass rate
- [x] **Pantretur validation logging** - Added warning when math doesn't match (PR #18)
- [x] **Hash orphan fix** - Hash now linked to `receipt_id` after receipt creation
  - Added RLS UPDATE policy migration
  - Enables CASCADE delete: deleting receipt removes hash → can re-upload

- [ ] **Promote structured parser to production** 🔥 HIGH PRIORITY
  - Production currently falls back to AI for all ICA table format receipts
  - Experimental parser works but is gated behind `parserVersion: 'experimental'`
  - Need 100% accuracy validation before promoting
  - **📋 Plan:** [`docs/STRUCTURED_PARSER_PROMOTION_PLAN.md`](docs/STRUCTURED_PARSER_PROMOTION_PLAN.md)

- [x] **BulkTester download logs feature** ✨ NEW
  - "Ladda ner loggar" button downloads combined markdown report
  - Contains summary, per-receipt results, items, and debug logs
  - Useful for sharing parser issues for debugging

- [x] **Parser Health Drill-down** (2026-02-08, PR #40)
  - [x] Link anomalies in Diagnostics to Training page
  - [x] Support auto-selection of receipts via `receiptId` URL param

**Known parser limitations** (documented, won't fix):
- Bundle discounts can result in negative item prices (totals correct)
- Bundle offer names (e.g. "4F25") may append to product names
- Some Pantretur totals don't match unit × qty
- Gemini API rate limit: 15 requests/minute (use Snabbläge for bulk testing)

**📋 Full details**: See [`docs/AAA_PARSING_TRAINING.md`](docs/AAA_PARSING_TRAINING.md)

- [x] **Fix linting errors in `supabase/functions/parse-receipt/index.ts`** (PR Pending)
  - 44 identified issues (mostly explicit `any` usage)
  - Plan includes new interfaces and stricter types

### Optional Enhancements

- [x] **Dev Toolbar for hidden route navigation** ⭐
  - Floating panel in bottom-right corner showing all routes
  - Only visible in development mode (`import.meta.env.PROD` check)
  - Keyboard shortcut: `⌘+Shift+D` to toggle visibility
  - Implemented in `src/components/DevToolbar.tsx`
  
- [ ] Custom domain via Vercel Domains
- [ ] Migrate receipt images to new Supabase storage bucket

---

## Infrastructure & CI 🏗️

- [ ] **Fix Parser Regression Test CI**
  - **Status:** Currently set to `continue-on-error: true` in `.github/workflows/parser-regression-test.yml`.
  - **Issue:** Edge Function occasionally returns non-2xx status codes during automated runs.
  - **Action:** Investigate stability of `parse-receipt` in CI environment and remove `continue-on-error` once reliable.

---

## Migration Status ✅

> **All phases complete as of December 29, 2024**

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Own Supabase instance | ✅ Complete |
| Phase 2 | Replace AI Gateway → Direct Gemini API | ✅ Complete |
| Phase 3 | Remove `lovable-tagger` | ✅ Complete |
| Phase 4 | New GitHub repo + Vercel hosting | ✅ Complete |

### Infrastructure Summary

| Component | Service |
|-----------|---------|
| Frontend | Vercel (`grocer-gist-2-0.vercel.app`) |
| Database | Supabase (`issddemuomsuqkkrzqzn`) |
| Edge Functions | Supabase (8 deployed) |
| AI | Google Gemini API (`gemini-2.5-flash`) |

### Data Migrated

- 117 receipts
- 1,057 product mappings
- 221 global mappings
- 5 store patterns
- 3 user overrides

**📋 Detailed migration walkthrough**: See `docs/MIGRATION_WALKTHROUGH.md`

---

## Code Review Findings (2024-12-26)

### Verified Compliant ✅

- [x] Supabase client setup - Context7 best practices
- [x] TanStack Query v5 hooks and cache management
- [x] React Router v6 declarative routing
- [x] React.lazy() + Suspense code splitting
- [x] Pagination for Supabase 1000 row limit
