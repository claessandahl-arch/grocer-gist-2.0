---
description: Generate implementation report after completing a feature
---

# Execution Report

## Context

Document what was implemented after completing a feature.

## Generate Report

Save to: `.agents/active/{feature-name}/execution.md`

### Template

```markdown
# Execution Report: {Feature Name}

## Meta
- Plan file: {path}
- Files added: {list}
- Files modified: {list}

## Validation Results
- TypeScript: ✓/✗
- Linting: ✓/✗
- Build: ✓/✗

## What Went Well
- {examples}

## Challenges
- {what was difficult}

## Divergences from Plan
- Planned: {what plan said}
- Actual: {what was done}
- Reason: {why}

## Recommendations
- Plan improvements: {suggestions}
- AGENTS.md additions: {suggestions}
```
