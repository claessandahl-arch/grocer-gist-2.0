# Migration Walkthrough - Lovable to Self-Hosted

**Completed**: December 29, 2024

---

## Summary

Successfully migrated from Lovable Cloud to fully self-hosted infrastructure:

| Before | After |
|--------|-------|
| Lovable Cloud (`mbxrezbotqxttjemwvqk`) | Self-hosted Supabase (`issddemuomsuqkkrzqzn`) |
| Lovable AI Gateway | Direct Gemini API |
| Lovable deploy | Supabase CLI deploy |
| Lovable hosting | Vercel (`grocer-gist-2-0.vercel.app`) |

---

## Migration Phases

### Phase 1: Own Supabase Instance ✅
- Created new Supabase project (EU-North, Stockholm)
- Applied 40 migrations (fixed 5 PostgreSQL syntax issues)
- Fixed: LATERAL joins, policy duplicates, timestamp conflicts
- Created `receipts` storage bucket with RLS policies

### Phase 2: Replace AI Gateway ✅
- Replaced `LOVABLE_API_KEY` with direct `GEMINI_API_KEY`
- Updated all 5 Edge Functions to use Gemini API directly
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- Model: `gemini-2.5-flash`

### Phase 3: Frontend Cleanup ✅
- Removed `lovable-tagger` package
- Updated vite.config.ts
- Replaced OpenGraph images
- Updated documentation

### Phase 4: New GitHub + Vercel ✅
- Created new repo: `grocer-gist-2.0`
- Deployed to Vercel with auto-deploy from `main`
- Domain: `grocer-gist-2-0.vercel.app`

---

## Edge Functions Deployed

All 6 functions deployed via `supabase functions deploy`:
1. `parse-receipt` - AI receipt parsing
2. `suggest-categories` - AI category suggestions
3. `suggest-product-groups` - AI product grouping
4. `suggest-group-merges` - AI group consolidation
5. `auto-map-products` - Automatic product mapping
6. `admin-delete-all` - Admin utility

---

## Data Migration

Created `export-data` function on Lovable with pagination support.

**Exported & Imported:**
| Table | Records |
|-------|---------|
| receipts | 117 |
| product_mappings | 1,057 |
| global_product_mappings | 221 |
| store_patterns | 5 |
| user_global_overrides | 3 |

**User ID Mapping:**
- Old: `c7498548-9f65-4540-96ab-0068afb6d5fc`
- New: `8c25d815-0a20-493a-bb79-1ef602e7cdfb`

---

## Configuration

### Environment Variables (.env)
```bash
VITE_SUPABASE_URL="https://issddemuomsuqkkrzqzn.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOi..."
```

### Supabase Secrets
```bash
supabase secrets set GEMINI_API_KEY=your_key
```

---

## Remaining Notes

- **Receipt images**: Still point to old Lovable Storage URLs (will work until bucket deleted)
- **54 unmapped products**: Were never mapped in old system - can use auto-map
- **Old Lovable app**: Still works independently as backup reference

---

## Resources

- **New Supabase Dashboard**: https://supabase.com/dashboard/project/issddemuomsuqkkrzqzn
- **New GitHub Repo**: https://github.com/claessandahl-arch/grocer-gist-2.0
- **Vercel Dashboard**: https://vercel.com (project: grocer-gist-2-0)
- **Frozen Old Repo**: https://github.com/claessandahl-arch/grocer-gist
