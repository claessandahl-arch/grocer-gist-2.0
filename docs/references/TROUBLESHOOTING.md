# Troubleshooting & Common Issues

## Common Issues & Solutions

1. **Build Error: "FixedSizeList" not exported**
   - **Symptom**: Error when using react-window.
   - **Solution**: Use `List` from react-window v2 API, not `FixedSizeList` from v1.

2. **Swedish Characters in Filenames**
   - **Symptom**: Storage errors or file not found.
   - **Solution**: Always use `sanitizeFilename()` before uploading. Converts: å→a, ä→a, ö→o.

3. **Dashboard Not Showing Data**
   - **Check**: RLS policies, user authentication, date range selection.
   - **Verify**: Database views are created (run migrations).

4. **AI Parsing Failures**
   - **Check**: Lovable API key is set? (Check Gemini key).
   - **Verify**: Image URLs are accessible.
   - **Review**: Edge function logs in Supabase dashboard for status 402 (Payment Required) or 429 (Too Many Requests).

5. **Category Mismatches**
   - **Understand**: Category correction priority system (User > Global > Receipt > Other).
   - **Check**: User mappings and global mappings in database.
   - **Use**: DataManagement page to correct categories.

6. **Vercel Build Failed**
   - **Symptom**: Vercel deployment fails with build errors.
   - **Cause**: Syntax errors or type errors in the code that break the build.
   - **Solution**: Run `npm run build` locally. If it fails, fix the errors before pushing.
   - **Prevention**: Never push code that hasn't passed a local build check.

7. **Product Mapping Not Finding Matches** (PR #19)
   - **Symptom**: "AI-mappa till grupper" returns no suggestions even for obvious matches (e.g., SALLADSLÖK → Salladslök).
   - **Cause**: Case-sensitivity mismatch. Receipts may contain "SALLADSLÖK" but mapping exists for "salladslök".
   - **Rule**: Always use **case-insensitive** matching (`toLowerCase()`) when:
     - Checking if a product is already mapped.
     - Looking up product mappings.
     - Comparing product names from receipts vs. database.
   - **Key files**: `ProductManagement.tsx`, `auto-map-products/index.ts`.

8. **Supabase API Row Limits** ⚠️ CRITICAL
   - **Problem**: Supabase has a default API row limit of **1000 rows per query**.
   - **Symptoms**: Queries return exactly 1000 rows; new records don't appear.
   - **Solution**: Use pagination to fetch all rows.
   ```typescript
   const PAGE_SIZE = 1000;
   let allData: any[] = [];
   let from = 0;
   let hasMore = true;

   while (hasMore) {
     const { data, error } = await supabase
       .from('your_table')
       .select('*')
       .eq('user_id', user.id)
       .range(from, from + PAGE_SIZE - 1);

     if (error) throw error;
     
     if (data && data.length > 0) {
       allData = [...allData, ...data];
       from += PAGE_SIZE;
       hasMore = data.length === PAGE_SIZE;
     } else {
       hasMore = false;
     }
   }
   ```
   - **Alternatively**: Increase the limit in Supabase Dashboard → Project Settings → API → "Max Rows".
   - **Affected areas**: `ProductManagement.tsx`, `DataManagement.tsx`.

## Recurring Technical Issues & Fixes (Lessons Learned)

### Supabase Edge Functions
- **Deno Runtime**: Edge Functions use Deno, not Node.js.
  - **Issue**: Cannot import Edge Function code directly into Node.js tests.
  - **Fix**: Use Deno CLI for local testing (`deno test`) or duplicate logic in test harness with sync warnings.
- **Testing Context**: `localhost:8080` hits **production** Edge Functions by default.
  - **Fix**: To test changes, you MUST deploy to the function first: `supabase functions deploy [name]`.
  - **Workflow**: Edit -> Deploy -> Test Localhost -> Verify -> Merge.

### Swiss/Swedish Receipt Parsing
- **Multi-buy Codes**: Patterns like "4F30" (4 for 30kr) or "2F35".
- **Öresavrundning (Rounding)**: Small diffs (< 1 kr) are normal.
  - **Pattern**: Add synthetic "Avrundning" item when `0.01 < |diff| < 1.0`.
- **Merged Digits Bug**: Regex `/[,.](\d+)[,.](\d+)$/` can capture merged fields (e.g., `,052,00`).
  - **Fix**: Use unit price sanity checks. If `qty > 1` and `unitPrice < 1`, fallback to `qty=1`.

### Database Cleanup
- **Pattern**: Implement cleanup tools with **Scan** (read-only) vs **Fix** (write) modes.
- **Example**: "Corrupt Categories" cleanup tool uses this pattern to verify scope before fixing.
