# Testing Architecture - Grocer Gist 2.0

This document clarifies the testing environment and deployment context for Grocer Gist 2.0, particularly regarding Supabase Edge Functions.

---

## Local Development Environment (localhost:8080)

When running `npm run dev`, the application runs with the following architecture:

| Component | Environment | Details |
|-----------|-------------|---------|
| **Frontend** | Local | Vite dev server on port 8080 |
| **Supabase Client** | Production | Points to production Supabase project |
| **Database** | Production | All queries hit production database |
| **Edge Functions** | Production | Calls **deployed** functions, NOT local code |
| **Authentication** | Production | Uses production auth configuration |

**Key Insight:** Even though the frontend runs locally, **all backend interactions happen against production**.

---

## Testing Edge Functions

### Current Setup (Production Testing)

```bash
# 1. Make changes to Edge Function code
vim supabase/functions/parse-receipt/index.ts

# 2. Deploy to production
supabase functions deploy parse-receipt

# 3. Test on localhost:8080
# The app will now call the newly deployed version

# 4. Verify behavior in production context
```

**Critical Understanding:**
- localhost:8080 frontend → **Production Supabase Edge Functions**
- Changes to local `supabase/functions/` code are **NOT** visible until deployed
- Deployment from a feature branch deploys that branch's code, not main

### Example: Bulk Receipt Testing

When running bulk receipt tests from localhost:8080:

```
User clicks "Test All Receipts" 
    ↓
Frontend sends requests to production Supabase
    ↓
Production Edge Function processes receipts (deployed version)
    ↓
Results stored in production database
    ↓
Frontend displays results
```

**If you just changed Edge Function code locally:**
- ❌ **Without deploy**: Test will use OLD deployed version
- ✅ **After deploy**: Test will use NEW deployed version

---

## Local Supabase Development (Not Currently Set Up)

To test Edge Functions locally without deploying to production, you would need:

### Setup Process
```bash
# Start local Supabase (requires Docker)
supabase start

# Serve Edge Functions locally
supabase functions serve

# Update .env.local to point to local Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key>
```

### Tradeoffs

| Approach | Pros | Cons |
|----------|------|------|
| **Production Testing** (current) | • Real environment<br>• No local setup needed<br>• Tests against real data | • Deploys affect production<br>• Requires deployment per test<br>• Cannot test destructive operations safely |
| **Local Testing** (not set up) | • Safe isolated testing<br>• Fast iteration<br>• No production impact | • Docker dependency<br>• Local data setup needed<br>• Environment differences from prod |

---

## Deployment Workflow for Edge Functions

### Recommended Flow

```bash
# 1. Create feature branch
git checkout -b fix/parser-bug

# 2. Make changes to Edge Function
vim supabase/functions/parse-receipt/index.ts

# 3. Deploy from feature branch (production testing)
supabase functions deploy parse-receipt
# Output: Deployed version: 29

# 4. Test on localhost:8080
# - Run bulk tests
# - Verify fix works in production

# 5. Create PR (code only, not deployment config)
git add supabase/functions/parse-receipt/index.ts
git commit -m "fix: improve parser quantity extraction"
git push -u origin fix/parser-bug
gh pr create

# 6. Merge PR to main
# (Feature branch version is already deployed, so production is up to date)

# 7. Optional: Deploy from main for consistency
git checkout main
git pull
supabase functions deploy parse-receipt
```

**Key Point:** Deploying from a feature branch is **safe** because Edge Functions are versioned. If something breaks, you can redeploy from main.

---

## Testing Checklists

### Before Deploying Edge Function
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code review completed (if applicable)
- [ ] Local code changes committed to feature branch

### After Deploying Edge Function
- [ ] Note the deployed version number
- [ ] Test affected functionality on localhost:8080
- [ ] Monitor Supabase logs for errors: `supabase functions logs [name]`
- [ ] Verify expected behavior in production environment
- [ ] If successful, proceed with PR

### If Deployment Breaks Production
```bash
# Option 1: Redeploy from main
git checkout main
supabase functions deploy [function-name]

# Option 2: Check function logs
supabase functions logs [function-name] --limit 100

# Option 3: Rollback to specific version (if supported)
# Check Supabase dashboard for version history
```

---

## Common Pitfalls

### ❌ "I changed the code but tests still fail"

**Problem:** Changed local code but didn't deploy.

**Solution:**
```bash
supabase functions deploy [function-name]
# Then re-run tests
```

### ❌ "Edge Function works locally but fails in production"

**Problem:** Deno runtime differences, missing environment variables, or RLS policies.

**Solution:**
- Check `supabase functions logs [name]` for errors
- Verify all `Deno.env.get()` variables are set in Supabase Dashboard
- Test RLS policies using `psql` or Supabase SQL editor

### ❌ "Bulk test shows old behavior after merge"

**Problem:** PR merged to main, but deployed version is still from feature branch.

**Solution:**
```bash
git checkout main
git pull
supabase functions deploy [function-name]
```

---

## Future Improvements

### Recommended: Set Up Local Supabase

**Benefits:**
- Safe testing without production impact
- Faster iteration (no deployment delay)
- Ability to test destructive operations

**Setup Guide:**
1. Install Docker Desktop
2. Run `supabase init` (if not already done)
3. Run `supabase start`
4. Create `.env.local` with local credentials
5. Update dev scripts to use local environment flag

**Estimated Effort:** 1-2 hours initial setup, 15 min per new developer.

---

## Reference Links

- **Supabase Edge Functions Docs**: https://supabase.com/docs/guides/functions
- **Deno Runtime**: https://deno.land/
- **Supabase CLI**: https://supabase.com/docs/guides/cli

---

*Document created: 2026-02-07*  
*Last updated: 2026-02-07*  
*Context: Parser bug fix session (PR #34)*
