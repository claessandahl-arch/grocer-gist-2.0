severity: low
file: src/components/admin/ParserHealthDashboard.tsx
line: 41
issue: Use of `any` casting for Supabase client bypasses type safety
suggestion: Run `supabase gen types` in a future task to generate types for the new views (parser_health_metrics, parser_anomalies)

severity: low
file: supabase/functions/parse-receipt/index.ts
line: 99
issue: Hardcoded unit price threshold (0.50 kr) might flag legitimate cheap items
suggestion: Monitor the "Recent Anomalies" list for false positives (e.g. small candies) and adjust the threshold if needed.

severity: low
file: supabase/functions/parse-receipt/index.ts
line: 2029
issue: Hardcoded JSONB column default in migration vs edge function logic
suggestion: Ensure the migration sets a default `{}` and the edge function handles nulls gracefully (which it does via optional chaining). No immediate action needed.
