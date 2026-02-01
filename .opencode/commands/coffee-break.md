---
description: End session safely - check for uncommitted work and sync to GitHub
---

# Coffee Break: Safe Session End

Run before closing IDE to ensure nothing is lost.

## Pre-Flight Checks

// turbo
1. Check for uncommitted changes
```bash
git status
```

// turbo
2. Check for unpushed commits
```bash
git log origin/main..HEAD --oneline
```

// turbo
3. Check for stashed changes
```bash
git stash list
```

## Decision Matrix

| Change Type | Action |
|-------------|--------|
| Documentation updates | ✅ Commit & push to main |
| Workflow/config changes | ✅ Commit & push to main |
| Bug fixes (small) | ✅ Commit & push to main |
| New features | ⚠️ Feature branch + PR |
| Large refactors | ⚠️ Feature branch + PR |

## Final Sync

// turbo
4. Push remaining changes
```bash
git push
```

// turbo
5. Confirm clean state
```bash
git status && git log origin/main..HEAD --oneline
```

## All Clear Checklist

- [ ] No uncommitted changes
- [ ] No unpushed commits
- [ ] No forgotten stashes

**☕ Safe to take that coffee break!**
