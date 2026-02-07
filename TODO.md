# TODO

> **Last session:** 2026-01-17 — Fixed Price Comparison search filter bug (PR #27), added comprehensive documentation (`docs/PRICE_COMPARISON.md`)

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

- [ ] **Perceptual hash collision causes false duplicate detection** 🔥 NEW
  - **Symptom:** Upload blocked with "Duplikat upptäckt" for a different receipt
  - **Root cause:** Two visually similar receipts produce the same perceptual hash
  - **Example:** `ICA Nära Älvsjö 2025-09-29` collided with `ICA Nära Älvsjö 2026-02-01`
  - **Workaround:** Delete the colliding hash manually via Supabase SQL Editor
  - **📋 Fix Plan:** [`docs/HASH_COLLISION_FIX_PLAN.md`](docs/HASH_COLLISION_FIX_PLAN.md)

- [ ] **Receipt images on old storage**
  - Images still point to old Lovable Storage URLs
  - Will work until that bucket is deleted
  - Consider migrating images to new storage bucket


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
| Edge Functions | Supabase (6 deployed) |
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
