---
description: Fix bugs found in code review
---

# Code Review Fix

## Input

Read code review file from: `.agents/active/{feature-name}/review.md`

## Process

1. Read the code review file

2. For each issue:
   - Explain what was wrong
   - Implement the fix
   - Verify with type check

**🧠 Sequential Thinking for Debugging (Automatic):**  
For complex bugs, AI uses systematic reasoning to:
- Trace root causes step-by-step
- Test hypotheses about the bug
- Consider all affected code paths
- Design fixes that prevent recurrence
- Evaluate fix impact on related code

This leads to more robust fixes with fewer regressions.

3. After all fixes:
   - Run `/validate` workflow

## Output

- Issues fixed (with before/after)
- Validation results
