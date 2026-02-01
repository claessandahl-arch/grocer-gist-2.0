---
description: Prime agent with codebase understanding
---

# Prime: Load Project Context

Build comprehensive understanding of the codebase.

## Process

// turbo
1. List all tracked files
git ls-files

// turbo
2. Show directory structure
find . -maxdepth 3 -type d -not -path '*/node_modules/*' -not -path '*/.git/*' | head -50

3. Read Core Documentation
- AGENTS.md (root context)
- README.md
- .opencode/reference/TECH_STACK.md (architecture details)
- .opencode/PRD.md (Product Requirements)

4. Identify Key Files
- `src/App.tsx` (or main entry point)
- `src/lib/api.ts` (or data layer)
- `src/types/` (core types)
- `package.json` - Dependencies

5. Check recent activity
git log -10 --oneline

// turbo
6. Check current branch and status
git status

// turbo
7. Check Available Agent Commands
ls .opencode/commands

## Output Report

### Project Overview
- Purpose: [Derived from PRD]
- Stack: [Derived from package.json/TECH_STACK.md]
- Key Features: [Derived from PRD]

### Architecture
- Data model patterns
- State management
- Component library

### Current State
- Active branch
- Recent changes
- Any concerns

**Keep summary scannable with bullet points.**
