# TODO

> **Last session:** 2026-01-03 — Fixed AI-mappa case-sensitivity (PR #19), category standardization (PRs #20, #21). Now on paid Gemini plan.

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

## Known Bugs 🐛

- [ ] **Receipt images on old storage**
  - Images still point to old Lovable Storage URLs
  - Will work until that bucket is deleted
  - Consider migrating images to new storage bucket

---

## Future Improvements 🚀

### Minor Cleanup

- [ ] Remove console.log statements from `ProductManagement.tsx`
- [ ] Add TypeScript types for database views (currently using `any`)

### Structured Parsing (January 2026)

- [x] **ICA Kvantum structured parser** - Fixed! Now supports ICA Kvantum, Nära, Maxi, Supermarket with 94% pass rate
- [x] **Pantretur validation logging** - Added warning when math doesn't match (PR #18)
- [ ] **Refactor hash saving flow** - Save hash AFTER receipt creation to prevent orphaned hashes

**Known parser limitations** (documented, won't fix):
- Bundle discounts can result in negative item prices (totals correct)
- Bundle offer names (e.g. "4F25") may append to product names
- Some Pantretur totals don't match unit × qty

**📋 Full details**: See [`docs/AAA_PARSING_TRAINING.md`](docs/AAA_PARSING_TRAINING.md)

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
