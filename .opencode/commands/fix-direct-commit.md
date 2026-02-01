---
description: Fix accidental commit to main branch
---

# Fix Direct Commit to Main

If you accidentally committed directly to `main` instead of a feature branch, use this workflow to fix it.

## Verify the Problem

// turbo
1. Check current branch
```bash
git branch --show-current
```

If it shows `main` and you just committed, proceed:

## Fix the Mistake

// turbo
2. Undo the commit (keep changes staged)
```bash
git reset --soft HEAD~1
```

// turbo
3. Create proper feature branch
```bash
git checkout -b fix/accidental-commit-fix
```

**Note:** Replace `accidental-commit-fix` with a descriptive name

// turbo
4. Re-commit with same message
```bash
git commit -C ORIG_HEAD
```

## Push and Create PR

// turbo
5. Push feature branch
```bash
git push -u origin $(git branch --show-current)
```

6. Create PR
```bash
gh pr create --base main --head $(git branch --show-current)
```

## Clean Up (Optional)

If you already pushed to `main`:

```bash
# Force push main back to remote state
git checkout main
git reset --hard origin/main
git checkout -  # Return to feature branch
```

**⚠️ WARNING:** Only do this if no one else has pulled your bad commit!
