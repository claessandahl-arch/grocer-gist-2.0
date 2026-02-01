---
description: Create comprehensive feature plan with deep codebase analysis
---

# Plan Feature: $ARGUMENTS

## Mission

Transform a feature request into a **comprehensive implementation plan**. 

**Core Principle**: NO CODE in this phase. Create a context-rich plan for one-pass implementation.

## Planning Process

### Phase 1: Feature Understanding

- Extract core problem being solved
- Identify user value
- Determine type: New Feature / Enhancement / Bug Fix / Refactor
- Assess complexity: Low / Medium / High

**User Story:**
```
As a <user type>
I want to <action/goal>
So that <benefit>
```

### Phase 2: Codebase Analysis

**1. Check Context7 for libraries:**
Use Context7 MCP tools for relevant libraries (e.g., `/supabase/supabase`, `/tanstack/query`, `/tailwindlabs/tailwindcss`).

**2. Pattern Recognition:**
- Search for similar implementations
- Check core data layers (e.g., `src/lib/api.ts` or similar)
- Check type definitions
- Review AGENTS.md for project rules

**3. Integration Points:**
- Files to modify
- New files needed
- Router/navigation changes

**🧠 Sequential Thinking (Automatic):**  
For complex features, AI may use systematic reasoning to:
- Compare multiple architectural approaches (e.g., state management patterns)
- Analyze security/performance trade-offs
- Design robust data models
- Identify integration challenges early
- Plan for edge cases and error scenarios

This results in more thorough, production-ready plans.

### Phase 3: Create Plan

Save to: `.agents/active/{feature-name}/plan.md`

**Plan Structure:**
```markdown
# Feature: {name}

## Description
## User Story
## Files to Create/Modify
## Step-by-Step Tasks
## Testing Strategy
## Validation Commands
## Acceptance Criteria
```

### Phase 4: Validation Commands

Always include:
```bash
npx tsc --noEmit  # Type check
npm run lint      # Linting
npm run build     # Full build
```

## Output

After creating plan:
- Summary of approach
- Path to plan file
- Complexity assessment
- Confidence score (/10)

---

> ⚠️ **STOP HERE** — Do NOT proceed to implementation.
> 
> The user must explicitly call `/execute [plan-path]` to start coding.
> Never interpret "LGTM" or approval as permission to start implementing.
