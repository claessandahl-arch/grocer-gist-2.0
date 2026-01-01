# TODO

## Fixed Bugs ✅

- [x] **"Sök liknande grupper" timeout fixed** (PR #2)
  - Reduced batch size from 200 → 75 groups to prevent Gemini API timeout
  - Groups sorted by product count to prioritize larger groups

## Known Bugs 🐛

- [ ] **54 products still unmapped**
  - These were never mapped in the old system
  - Can run auto-map to fix

- [ ] **Receipt images on old storage**
  - Images still point to old Lovable Storage URLs
  - Will work until that bucket is deleted
  - Consider migrating images to new storage bucket

---

## Future Improvements 🚀

### Minor Cleanup

- [ ] Remove console.log statements from `ProductManagement.tsx`
- [ ] Add TypeScript types for database views (currently using `any`)

### Structured Parsing Investigation

- [ ] **Fix ICA Kvantum structured parser** - PDF text extraction merges fields without spaces, causing regex patterns to fail. Currently falling back to AI parser.
- [ ] **Refactor hash saving flow** - Save hash AFTER receipt creation to prevent orphaned hashes on 429 errors.
- [ ] **Add retry logic for rate limits** - Exponential backoff for Gemini 429 errors.

**📋 Detailed investigation report**: See [`Docs/STRUCTURED_PARSING_INVESTIGATION.md`](Docs/STRUCTURED_PARSING_INVESTIGATION.md)

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
