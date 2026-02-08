severity: low
file: src/components/training/BulkTester.tsx
line: 264
issue: Use of `any` casting for `data.parser_metadata` bypasses type safety
suggestion: Acceptable for now as the Edge Function return type is not strictly typed in the frontend client. Consider defining a stricter response type later.

severity: low
file: supabase/functions/cleanup-categories/index.ts
line: 44
issue: Fetching all product mappings into memory could cause issues if the table grows very large (>10k rows)
suggestion: Add a `TODO` comment to implement pagination for the `scan` and `fix` actions when the dataset scales up. Current implementation is fine for typical use (<2k items).

severity: low
file: supabase/functions/cleanup-categories/index.ts
line: 1
issue: Deno imports (https://...) cause TS errors in some editors because `deno.ns` types aren't loaded in the main project context
suggestion: This is a known VS Code configuration issue with hybrid Node/Deno repos. The code is valid and deployed successfully. No action needed.
