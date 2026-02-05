# Implementation Plan - Fix Parse Receipt Linting Errors

## Description
Resolve 44 linting errors in `supabase/functions/parse-receipt/index.ts`. The errors are primarily due to explicit `any` usage, unassigned `let` variables, and unnecessary regex escapes. This refactor will improve type safety without altering the core parsing logic.

## User Story
```
As a developer
I want to resolve the linting errors in the receipt parser function
So that the codebase is type-safe, maintainable, and passes CI checks.
```

## Technical Approach
- **Interfaces**: Create `ParserDebugInfo` and `WorkingParsedItem` interfaces to replace `any`.
- **Type Safety**: Update function signatures and variable declarations to use these new interfaces.
- **Code Style**: Fix `prefer-const` and `no-useless-escape` errors.

## Files to Modify
- `supabase/functions/parse-receipt/index.ts`

## Step-by-Step Tasks

### 1. Define Interfaces
- [ ] Add `ParserDebugInfo` interface at the top of the file to handle the flexible `_debug` object structure.
- [ ] Add `WorkingParsedItem` interface extending `ParsedItem` to handle internal flags like `_expectsDiscount` and `_isCoupon`.

### 2. Fix Type Definitions
- [ ] Update `ItemDiff` interface to replace `any` with `string | number | undefined`.
- [ ] Update return types for parser functions (`parseWillysReceiptText`, `parseICAKvantumText`, `parseICAReceiptText`) to use `ParserDebugInfo`.

### 3. Fix Logic & Style Issues
- [ ] Line 197: Change `let line` to `const line`.
- [ ] Line 627: Remove unnecessary escape character `\.` in regex `[\.]`.
- [ ] Line 666: Remove `as any` cast for category assignment.

### 4. Replace Explicit Any Casts
- [ ] Replace `(currentProduct as any)` with `(currentProduct as WorkingParsedItem)` in the loop logic (approx lines 584, 602, 605, 616, 670, 792).
- [ ] Update `structuredResult` definition to use `ParserDebugInfo`.
- [ ] Fix reduce callback signature on line 2368 to use `ParsedItem` instead of `any`.

## Testing Strategy
1. **Static Analysis**: Run `npm run lint` to verify zero errors in the file.
2. **Type Check**: Verify no TypeScript errors are introduced.

## Validation Commands
```bash
# Linting (Primary Success Metric)
npm run lint

# Build (Sanity Check)
npm run build
```

## Acceptance Criteria
- [ ] `npm run lint` reports 0 errors for `supabase/functions/parse-receipt/index.ts`.
- [ ] No logical changes are made to the parsing algorithms.
