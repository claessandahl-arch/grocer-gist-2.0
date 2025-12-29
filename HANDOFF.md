# Project Handoff Document - Grocer-gist 2.0

> **Created**: Dec 29, 2024
> **Purpose**: Context preservation when switching workspaces

---

## Project Overview

**Grocer-gist** is a Swedish grocery receipt tracking app that uses AI (Gemini) to parse receipts and provide spending insights.

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions, Storage, Auth)
- **AI**: Direct Google Gemini API (`gemini-2.5-flash`)
- **Hosting**: Vercel (NEW) - previously Lovable Cloud

---

## Migration History (Dec 2024)

### Completed Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 2 | Replace Lovable AI Gateway → Direct Gemini API | ✅ Complete |
| Phase 3 | Remove `lovable-tagger` from frontend | ✅ Complete |
| Phase 1 | Own Supabase Instance | ✅ Complete |
| Phase 4 | New GitHub Repo + Vercel | ✅ Complete |

### Key Credentials

**New Supabase Project:**
- Project ID: `issddemuomsuqkkrzqzn`
- URL: `https://issddemuomsuqkkrzqzn.supabase.co`
- 40 migrations applied
- 6 Edge Functions deployed

**New GitHub Repo:**
- https://github.com/claessandahl-arch/grocer-gist-2.0

**Vercel Deployment:**
- URL: `grocer-gist-2-0.vercel.app`
- Auto-deploys from `main` branch

**Old (Frozen) Resources:**
- Old Supabase: `mbxrezbotqxttjemwvqk` (Lovable Cloud - backup only)
- Old GitHub: `claessandahl-arch/grocer-gist` (frozen for reference)
- Old Lovable app still works independently

---

## Data Migration Summary

Successfully imported from Lovable Cloud to new Supabase:
- 117 receipts
- 1057 product mappings
- 221 global mappings
- 5 store patterns
- 3 user overrides

User ID mapping:
- Old: `c7498548-9f65-4540-96ab-0068afb6d5fc`
- New: `8c25d815-0a20-493a-bb79-1ef602e7cdfb`

---

## Known Bugs 🐛

1. **"Sök liknande grupper" returns 500 error**
   - Function: `suggest-group-merges` Edge Function
   - Location: Products → Auto-Gruppering → "Sök liknande grupper" button
   - Status: Not investigated yet

2. **54 products still unmapped**
   - These were never mapped in old system
   - Can run auto-map to fix

3. **Receipt images on old storage**
   - Images still point to old Lovable Storage URLs
   - Will work until that bucket is deleted

---

## Project Guidelines (from CLAUDE.md)

1. **Never commit directly to `main`** - use feature branches + PRs
2. **Always run `npm run build`** before pushing
3. **Use Context7** for documentation lookup
4. **Dev server runs on port 8080** (not 5173)
5. **Supabase has 1000 row limit** - use pagination for large tables

---

## Next Steps / TODO

1. **Add Dev Toolbar** - Quick route navigator for dev mode only
2. **Fix suggest-group-merges bug** - Debug the 500 error
3. **Update CLAUDE.md** - Remove Lovable hosting references
4. **Optional: Custom domain** - Can add via Vercel Domains

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Complete project documentation |
| `TODO.md` | Task list and known bugs |
| `src/lib/categoryConstants.ts` | Category definitions |
| `src/integrations/supabase/client.ts` | Supabase client setup |
| `supabase/functions/` | 6 Edge Functions |
| `supabase/migrations/` | 40 database migrations |

---

## Environment Variables (for .env)

```bash
VITE_SUPABASE_URL="https://issddemuomsuqkkrzqzn.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzc2RkZW11b21zdXFra3J6cXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MDQ4OTQsImV4cCI6MjA4MjM4MDg5NH0.rU9Noxw2mhI5uY0zTGzjbxqoN9pJgZnIhOyDjGLKnds"
```

---

## Quick Start for New Session

1. Read this handoff document
2. Read `CLAUDE.md` for full project details
3. Check `TODO.md` for current tasks
4. Run `npm run dev` (starts on port 8080)
5. Use Context7 for library documentation
