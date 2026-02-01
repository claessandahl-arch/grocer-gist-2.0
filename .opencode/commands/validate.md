---
description: Run comprehensive project validation (lint, type-check, build)
---

# Validate: Full Validation Suite

## Validation Steps

// turbo
1. TypeScript type checking
```bash
npx tsc --noEmit
```

// turbo
2. ESLint
```bash
npm run lint
```

// turbo
3. Production build
```bash
npm run build
```

## Summary Report

| Check | Status | Details |
|-------|--------|---------|
| TypeScript | ✓/✗ | Type errors |
| ESLint | ✓/✗ | Linting issues |
| Build | ✓/✗ | Build output |

### Overall Status
- **PASS**: All checks passed, ready to commit
- **FAIL**: Issues need fixing
