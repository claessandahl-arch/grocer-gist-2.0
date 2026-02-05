# Code Review: Grocery Wrapped

## Technical Analysis

### Logic Errors

- **Hardcoded Year**: `src/hooks/useWrappedStats.ts` and `src/components/wrapped/HeroSlide.tsx` hardcode the year to `2025`. This will become outdated.
  - *Suggestion*: Use `new Date().getFullYear() - 1` for "last year" or pass it as a prop/context.
- **Type Safety**: `src/hooks/useWrappedStats.ts` uses aggressive casting (`as unknown as WrappedOverview`).
  - *Risk*: If the RPC returns `null` or a different structure (e.g. empty data), the app will crash when accessing properties.
  - *Suggestion*: Add a runtime check or Zod schema validation before casting.
- **Slide Count**: `src/pages/Wrapped.tsx` hardcodes `totalSlides = 7` but renders conditionally.
  - *Risk*: If a slide is added/removed, the navigation logic might break.
  - *Suggestion*: Use an array of slide components and derive length from it.

### Security Issues

- **RPC Security**: The SQL functions use `SECURITY DEFINER`.
  - *Status*: **PASSED**. You correctly included `WHERE user_id = auth.uid()` in all queries and set `search_path = public, auth` in the latest migrations to prevent privilege escalation.

### Performance

- **Parallel Fetching**: `useWrappedStats` correctly uses `Promise.all` to fetch data in parallel.
  - *Status*: **GOOD**.
- **Caching**: `staleTime` of 5 minutes is appropriate for static historical data.
  - *Status*: **GOOD**.
- **Bundle Size**: `Wrapped` page is lazy-loaded.
  - *Status*: **GOOD**.

### Code Quality

- **Component Structure**: `src/components/wrapped/` structure is clean and modular.
- **Consistent Styling**: Tailwind CSS usage is consistent with the project's design system.
- **Hardcoded Strings**: Some text in `personalityCalculator.ts` and `Wrapped.tsx` is hardcoded in Swedish.
  - *Note*: This matches the project's language (Swedish), so it's acceptable, but consider i18n if that changes.

### Pattern Adherence

- **Supabase Integration**: Follows the project's pattern of using RPCs for complex aggregations.
- **UI Components**: Uses Shadcn/ui `Button` and Lucide icons correctly.

## Summary

The feature is well-architected with a clear separation of concerns (SQL aggregation -> Hook -> UI). The main area for improvement is dynamic date handling and runtime type safety for the RPC responses.

## Action Items

1.  [ ] Change hardcoded `2025` to dynamic year or configuration.
2.  [ ] Add null checks in `useWrappedStats` before casting data.
3.  [ ] Ensure `totalSlides` in `Wrapped.tsx` matches the actual rendered slide count.
