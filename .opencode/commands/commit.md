---
description: Create atomic commit with conventional message
---

# Commit: Create Atomic Commit

## ⚠️ CRITICAL: Feature Branch First

> **NEVER commit directly to `main`**
> **DO NOT archive active plans yet.** Files should remain in `.agents/active/` for this commit.

// turbo
0. Create and switch to feature branch
```bash
git checkout -b fix/descriptive-name
```

Use prefixes: `fix/`, `feat/`, `docs/`, `refactor/`, `chore/`

## Pre-Commit Checks

// turbo
1. Check status and changes
```bash
git status && git diff --stat HEAD
```

// turbo
2. Verify build passes
```bash
npm run build
```

## Create Commit

// turbo
3. Stage all changes
```bash
git add -A
```

4. Create commit with conventional message

**Prefixes:**
| Prefix | Use When |
|--------|----------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code restructuring |
| `chore:` | Maintenance, deps |
| `test:` | Adding tests |

**Format:** `prefix: short description`

**Examples:**
- `feat: Add category budget tracking`
- `fix: Resolve duplicate import detection`
- `docs: Update AGENTS.md with new patterns`

## Push and Create PR

// turbo
5. Push feature branch (NOT main)
```bash
git push -u origin $(git branch --show-current)
```

6. Create PR
```bash
gh pr create --base main --head $(git branch --show-current)
```

**STOP** - Let user review and merge the PR manually
