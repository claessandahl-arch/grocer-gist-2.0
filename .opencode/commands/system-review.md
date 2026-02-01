---
description: Analyze implementation against plan for process improvements
---

# System Review: Meta-Level Analysis

## Purpose

Analyze how well implementation followed the plan. Look for bugs in the **process**, not the code.

## Inputs

- Plan file: `$1`
- Execution report: `$2`

## Analysis

### Step 1: Understand Plan
- What was planned?
- What validation defined?

### Step 2: Understand Implementation
- What was actually done?
- What diverged?

### Step 3: Classify Divergences

**Good ✅** (Justified):
- Better pattern discovered
- Plan assumption wrong
- Security/performance issue found

**Bad ❌** (Problematic):
- Ignored constraints
- Created new patterns when existing ones work
- Took shortcuts

### Step 4: Process Improvements

Suggest updates to:
- AGENTS.md
- Workflow files
- New workflows needed

## Actions
- Update `.agents/SYSTEM_PATTERNS.md` with new learnings immediately.
- Update `AGENTS.md` or other reference docs if lessons are generalizable.

## Output

Save to: `.agents/active/{feature-name}/system-review.md`

### ⚠️ MANDATORY: Archiving
Once the review is complete, the agent **MUST** move the entire feature folder from `.agents/active/` to `.agents/archive/`. 

**This session is NOT complete until the active directory is empty of this feature.**

### Template

```markdown
# System Review: {Feature}

## Alignment Score: __/10

## Divergence Analysis
| Divergence | Classification | Root Cause |
|------------|----------------|------------|

## Improvements
- [ ] Update AGENTS.md: {what}
- [ ] Update workflow: {what}
```
