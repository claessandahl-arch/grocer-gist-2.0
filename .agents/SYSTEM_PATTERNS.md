# System Patterns & Shared Memory

This document stores the "collective memory" of the AI agents working on this repository. It captures recurring patterns, architectural decisions, and lessons learned to ensure consistency and prevent repeating mistakes.

## 1. Architectural Patterns

### Global State Management
- **TanStack Query (React Query)**: Used for server state (queries/mutations).
    - **Keys**: defined in separate query key factory or consistently named.
    - **Stale Time**: 0 for volatile data, 5 minutes for stable data.
- **Local State**: Use `useState` for UI-only state (modals, form inputs).
- **Context API**: Use sparingly for truly global UI settings (e.g., ThemeProvider).

### Component Composition
- **Container/Presenter**: Separate logic (Container) from UI (Presenter) where complex.
- **Shadcn UI**: Use as the base design system. Do not override styles unless necessary.
- **Tailwind CSS**: Use utility classes. Use `cn()` for dynamic class merging.

### Backend Integration
- **Supabase**: Direct client-side calls via `src/integrations/supabase/client.ts`.
- **Edge Functions**: Use for sensitive logic or complex aggregations not suitable for RLS.

## 2. Coding Conventions (Lessons Learned)

- **Date Handling**: Always use `date-fns`. Note: Swedish locale is standard for this app.
- **Imports**: Always use absolute imports (`@/components/...`) to avoid refactoring hell.
- **Error Handling**: 
    - Supabase errors often return 200 OK with `error` object. Always check `.error`.
    - Use `sonner` or `toast` for user-visible errors.

## 3. Recurring Issues & Fixes

### Supabase Edge Functions (Deno Runtime)
- **Issue**: Edge Functions use Deno runtime, not Node.js. Cannot directly import Edge Function code in Node.js tests.
- **Fix**: Either use Deno CLI for local testing (`deno test`) or duplicate parser logic in test harness with warning comment about keeping in sync.
- **Pattern**: **Edge Function Logic Isolation**. Extract complex logic (like `detectAnomalies`) into pure functions within the handler file so they can be unit-tested or copied to test harnesses easily.
- **Context**: Discovered during receipt parser testing (2026-02-07).

### Swedish Receipt Parsing Patterns
- **Multi-buy codes**: Swedish receipts use patterns like "4F30" (4 för 30 kr) or "2F35" (2 för 35 kr).
- **Öresavrundning**: Small rounding differences (< 1 kr) between calculated total and receipt total are normal due to Swedish cash rounding abolishment.
- **Pattern**: Add synthetic "Avrundning" item when `0.01 < |diff| < 1.0` to reconcile totals.
- **Context**: ICA Kvantum receipt parser improvements (2026-02-07).

### Code Review Protocol Violation (2026-02-07)
- **Issue**: Agent performed code review, then implemented suggestions without waiting for user approval.
- **Fix**: **NEVER implement code review suggestions without explicit user approval.**
- **Protocol**: 
  1. Perform code review → create review.md
  2. Present findings to user
  3. ⏸️ **STOP and wait for input**
  4. User decides: accept/modify/reject
  5. Only then implement approved changes
- **Rule**: Code review = recommendations, NOT instructions. User approval is MANDATORY.
- **Context**: Parser bug fix session violated autonomy boundaries (PR #34).

### Edge Function Testing Context (2026-02-07)
- **Issue**: localhost:8080 hits production Edge Functions, not local code. Caused confusion when bulk test showed bug after "deployment".
- **Fix**: Always deploy Edge Function BEFORE testing: `supabase functions deploy [name]`
- **Workflow**:
  1. Make changes to Edge Function code
  2. Deploy: `supabase functions deploy parse-receipt`
  3. Test on localhost:8080 (will now hit deployed version)
  4. Verify fix works in production
  5. Merge PR to main
- **Context**: ICA Kvantum parser fix (PR #34).

### Parser Merged Digits Bug Pattern (2026-02-07)
- **Issue**: Regex `/[,.](\d+)[,.](\d+)$/` can capture merged digits across price/quantity fields (e.g., `,052,00` → qty=52 instead of 2).
- **Fix**: Added unit price sanity check. If `qty > 1` but `unitPrice < 1 kr`, fallback to `qty=1`.
- **Pattern**: Swedish receipts often have format: `ITEM_NAME,quantity,unit_price`. Regex must not cross field boundaries.
- **Long-term**: Implement Parser Anomaly Detection System (Implemented 2026-02-08).
- **Context**: ICA Kvantum "Sunny Soda Nocco2F38" bug (PR #34).

*(Add entries here after `/system-review`)*
- [Example]: *Issue with Supabase realtime subscription cleanup caused memory leaks. Fix: Ensure `.unsubscribe()` is called in `useEffect` cleanup.*

## 4. Testing Strategy

- **Verify Build**: `npm run build` is the ultimate truth. If it fails, the PR fails.
- **Type Safety**: Trust TypeScript. Do not use `any` "just to make it work".
