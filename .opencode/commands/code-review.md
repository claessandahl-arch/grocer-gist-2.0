---
description: Technical code review for quality and bugs
---

# Code Review: Technical Analysis

## Core Principles

- Simplicity is the ultimate sophistication
- Code is read more than written - optimize for readability
- The best code is often the code you don't write

## Review Process

1. Read project context
   - AGENTS.md
   - .opencode/reference/TECH_STACK.md

// turbo
2. Check current changes
```bash
git status && git diff --stat HEAD
```

// turbo
3. List new files
```bash
git ls-files --others --exclude-standard
```

4. For each changed file, analyze:

### Logic Errors
- Off-by-one errors
- Incorrect conditionals
- Missing error handling

### Security Issues
- Exposed secrets
- XSS vulnerabilities
- SQL injection (less likely with Supabase RLS)

### Performance
- N+1 queries in TanStack Query
- Unnecessary re-renders
- Missing useMemo/useCallback

### Code Quality
- DRY violations
- Poor naming
- Missing TypeScript types

### Pattern Adherence
- Uses TanStack Query for data
- Uses Shadcn/ui components
- Swedish UI text
- Follows AGENTS.md rules

## Output

Save to: `.agents/active/{feature-name}/review.md`

```
severity: critical|high|medium|low
file: path/to/file.tsx
line: 42
issue: [description]
suggestion: [fix]
```
