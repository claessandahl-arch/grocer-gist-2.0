# Agent Guidelines & Repository Standards

This document is the primary source of truth for AI agents (Opencode, Cursor, Copilot) operating within the **Grocer Gist 2.0** repository.

## 1. Project Overview

**Grocer Gist 2.0** is a grocery and inventory management application migrated from Lovable Cloud.

- **Stack**: React 18, TypeScript, Vite, Tailwind CSS 3, Supabase (Auth, DB, Edge Functions).
- **UI Framework**: Shadcn/ui + Tailwind CSS.
- **State Management**: TanStack Query (React Query).
- **Routing**: React Router v6.
- **Date Handling**: date-fns (Swedish locale).
- **Hosting**: Vercel.

## 2. Operational Rules & Workflow

### Git Safety (CRITICAL)
1. **Never commit directly to `main`**. Always create a feature branch (`feat/`, `fix/`, `chore/`).
2. **Pull Requests required**. Create the PR and STOP. Do not auto-merge.
3. **No Force Pushes**. Avoid `git push -f`.
4. **Sync often**. Run `git pull` before starting work.
5. **Verify before push**. Always run `npm run build` locally to ensure type safety.
6. **Regression Testing**: Whenever a parser bug is fixed, a corresponding test case **MUST** be added to the Golden Set (`test-receipts/golden-set/`).

### Development Workflow (PIV)
Follow the **Plan → Implement → Validate** loop:
- `/plan-feature [name]`: Create implementation plan in `.agents/active/[name]/plan.md`.
- `/execute [name]`: Implement from the plan.
- `/validate`: Run linting and build checks.
- `/commit`: Create git commit with changes (including plan/execution docs).
- `/system-review`: Meta-analysis AND **MANDATORY** archive of the feature folder to `.agents/archive/`.

### Code Review Protocol
When performing a code review (spontaneous or via `/code-review`):

1. **Analyze**: Review code for security, logic, performance, and patterns.
2. **Document**: Create review findings in `.agents/active/[feature]/review.md`.
3. **Present**: Communicate findings to user with priority levels (High/Medium/Low).
4. **⏸️ STOP**: **NEVER implement changes without explicit user approval**.
5. **Wait**: User will decide to accept/modify/reject suggestions.
6. **Implement**: Only after user approval, make changes and commit.

**CRITICAL:** Code review findings are **recommendations**, not instructions. User approval is **MANDATORY** before making any changes, even for "obvious" improvements like comment clarifications.

### Edge Function Deployment
Supabase Edge Functions can be deployed independently from feature branches for production testing:

1. **Deploy from feature branch**: `supabase functions deploy [function-name]`
   - Example: `supabase functions deploy parse-receipt`
2. **Production context**: localhost:8080 calls **production** Edge Functions, not local code.
3. **Testing workflow**:
   - Make changes to `supabase/functions/[name]/index.ts`
   - Deploy: `supabase functions deploy [name]`
   - Test on localhost:8080 (will now hit deployed version)
   - Verify fix works in production environment
4. **Merge to main**: Only after production testing confirms fix works.

**Note:** Deploying from a feature branch does NOT deploy main branch code. The deployed version becomes active immediately in production.

### ⚠️ Mandatory Archiving Rule
An agent session for a feature is NOT complete until the `/system-review` is written and the entire directory is moved from `.agents/active/` to `.agents/archive/`. 
**CRITICAL:** Archive ONLY AFTER the final `/commit`. Never archive before committing, or the PR will lack context.

### Infrastructure Dependencies
If a feature requires external configuration (Supabase Dashboard, Vercel, etc.):
1. **Explicit Phase:** The Plan MUST include a "Configuration Phase" detailing these steps.
2. **Documentation:** Create a reference doc in `.opencode/reference/` if the steps are complex.
3. **Validation:** Explicitly state if the feature is "broken until configured" in the Execution Report.

### Verification Checklist
Before submitting a PR:
1. [ ] **Routes**: Verify all new navigation URLs exist (grep for `navigate()` calls).
2. [ ] **Build**: Run `npm run build` locally.
3. [ ] **Database**: If using RPCs, verify PostgREST compatibility (no default params).
4. [ ] **Secrets**: Ensure no secrets are committed.

## 3. Development Commands

| Task | Command | Description |
| :--- | :--- | :--- |
| **Install** | `npm install` | Install dependencies. |
| **Dev Server** | `npm run dev` | Start local development server (port 8080). |
| **Build** | `npm run build` | **MANDATORY**. Runs `vite build`. |
| **Lint** | `npm run lint` | Runs `eslint .`. |
| **Preview** | `npm run preview` | Preview production build. |

*Note: No automated test runner is currently installed. If adding tests, use **Vitest** given the Vite ecosystem.*

## 4. Coding Standards

### Formatting & Style
- **Indentation**: 2 spaces.
- **Semicolons**: **Always used**.
- **Quotes**: **Double quotes** (`"`) for imports and JSX attributes.
- **Components**: Functional components with named or arrow functions.
- **File Structure**:
    - `src/components/` (UI components)
    - `src/pages/` (Page components/Routes)
    - `src/lib/` (Utilities)
    - `src/hooks/` (Custom Hooks)

### Naming Conventions
- **Files**:
    - Components/Pages: `PascalCase.tsx` (e.g., `Dashboard.tsx`).
    - Hooks/Utils: `camelCase.ts` (e.g., `useAuth.ts`, `utils.ts`).
- **Components**: `PascalCase` (e.g., `ProductList`).
- **Functions/Vars**: `camelCase` (e.g., `handleSubmit`).
- **Constants**: `UPPER_SNAKE_CASE` (global); `camelCase` (local).
- **Interfaces/Types**: `PascalCase`.

### TypeScript Rules
- **Strictness**: Relaxed (`noImplicitAny: false` in `tsconfig.json`). Strive for type safety but respect existing loose patterns.
- **Avoid `any`**: Prefer defining specific interfaces (even if temporary) over using `any` to avoid technical debt.
- **Imports**: Use `@/` alias for `src/` (e.g., `import { Button } from "@/components/ui/button"`).
- **Order**:
    1. React / Standard Libs
    2. Third-party Libraries
    3. Internal Components (`@/components/...`)
    4. Hooks / Utils / Types
    5. Styles / Assets

### Key Implementation Details
- **Routing**: Add new routes in `App.tsx` *above* the catch-all `*` route. Lazy load using `React.lazy`.
- **Styling**: Use Tailwind utility classes. Use `cn()` (`clsx` + `tailwind-merge`) for conditional classes.
- **Supabase**: Use `src/integrations/supabase/client.ts`. Respect RLS.
- **Edge Functions**: 
    - Run on Deno runtime, not Node.js.
    - For local testing: use `deno test` or duplicate logic in Node.js test harness.
    - Imports use `https://deno.land/std@...` format.
- **PostgREST RPCs**: 
    - No default parameters (PostgREST requirement).
    - Set `search_path = public, auth` if using `auth.uid()`.
    - Use CTEs instead of nesting set-returning functions in aggregates.
- **TanStack Query**: Use `staleTime: 0` for volatile data, `staleTime: 5 mins` for stable data.

## 5. Agent Protocol

1. **Explore First**: Run `ls -R` or `glob` to understand structure before creating files.
2. **Context7 Integration**: Use Context7 MCP tools for documentation lookup before implementing new features.
3. **Check Conventions**: Read existing files to match style exactly (PascalCase files vs camelCase files).
4. **Atomic Changes**: Focus on one task at a time.
5. **No Hallucinations**: Only use libraries in `package.json`. Ask before installing new ones.

## 6. Implementation Plan Template (for `/plan-feature`)

When asked to plan a feature, use this structure:

```markdown
# Implementation Plan - [Feature Name]

## User Story
As a [user], I want to [action] so that [benefit].

## Technical Approach
- **Components**: Create `NewComponent.tsx`.
- **State**: Use local state or TanStack Query.
- **Database**: Update Supabase schema if needed.

## Step-by-Step
0. [ ] **Review existing implementation** (identify what already exists)
1. [ ] Create UI skeleton
2. [ ] Implement logic
3. [ ] Connect to Supabase
4. [ ] Verify build
```

**CRITICAL**: Always start with code review to avoid planning work that's already done.

## 7. Troubleshooting

- **Supabase Connection**: If 401/403 errors, check `.env` keys and RLS policies.
- **Build Errors**: Run `npm run build` to verify integrity.
- **Lint Errors**: Run `npm run lint`.

---
*Reference: `AGENTS.md` (this file), `package.json`*
