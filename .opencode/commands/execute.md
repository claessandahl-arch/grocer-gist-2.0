---
description: Execute an implementation plan
---

# Execute: Implement from Plan

## Plan to Execute

Read plan file from: `.agents/active/{feature-name}/plan.md`

## Execution Instructions

### 1. Read and Understand
- Read the ENTIRE plan
- Note dependencies between tasks
- Review validation commands

### 2. Execute Tasks in Order

For EACH task:

#### a. Implement
- Follow specifications exactly
- Use existing patterns from `src/lib/api.ts`
- Add proper TypeScript types
- Use Swedish for UI text

**🧠 Sequential Thinking (Automatic):**  
For complex tasks, AI may use systematic reasoning to:
- Break down algorithms into clear steps
- Explore edge cases before coding
- Design error handling strategies
- Consider performance implications
- Plan integration with existing code

You'll see better first-pass quality without any extra effort.

#### b. Verify as you go
// turbo
```bash
npx tsc --noEmit
```

### 3. Run Validation

// turbo
```bash
npm run lint
```

// turbo
```bash
npm run build
```

### 4. Final Checklist

- ✅ All tasks completed
- ✅ TypeScript passes
- ✅ Lint passes
- ✅ Build succeeds
- ✅ Swedish UI text

## Output Report

### Completed Tasks
- Files created (with paths)
- Files modified (with paths)

### Validation Results
```bash
# Output from each command
```

### Ready for Commit
- All validations pass
- Ready for `/commit` workflow
