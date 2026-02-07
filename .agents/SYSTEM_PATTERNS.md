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
- **Context**: Discovered during receipt parser testing (2026-02-07).

### Swedish Receipt Parsing Patterns
- **Multi-buy codes**: Swedish receipts use patterns like "4F30" (4 för 30 kr) or "2F35" (2 för 35 kr).
- **Öresavrundning**: Small rounding differences (< 1 kr) between calculated total and receipt total are normal due to Swedish cash rounding abolishment.
- **Pattern**: Add synthetic "Avrundning" item when `0.01 < |diff| < 1.0` to reconcile totals.
- **Context**: ICA Kvantum receipt parser improvements (2026-02-07).

*(Add entries here after `/system-review`)*
- [Example]: *Issue with Supabase realtime subscription cleanup caused memory leaks. Fix: Ensure `.unsubscribe()` is called in `useEffect` cleanup.*

## 4. Testing Strategy

- **Verify Build**: `npm run build` is the ultimate truth. If it fails, the PR fails.
- **Type Safety**: Trust TypeScript. Do not use `any` "just to make it work".
