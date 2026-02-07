# Code Review: Receipt Parser Accuracy Improvements

## Summary
Reviewed changes to `supabase/functions/parse-receipt/index.ts` (+53 lines, -6 lines) and new file `scripts/test-parser-local.ts` (667 lines).

---

## Issues Found

### 🟡 MEDIUM - Greedy Name Capture May Be Too Greedy

**File:** `supabase/functions/parse-receipt/index.ts`  
**Line:** 927-936

**Issue:**
The greedy capture pattern may incorrectly append footer information to product names if footer patterns are not comprehensive.

```typescript
if (!line.match(/^(Moms|Netto|Brutto|Totalt|Kort|Erhållen|Avrundning|\\d+[,.]\\d+$)/) &&
    !line.match(/^\\d{10,}$/)) {
  (currentProduct as WorkingParsedItem).name += ' ' + line;
```

**Risk:** If ICA adds new footer patterns (e.g., "Delavstämning", "Öresavrundning", "Betalningsinformation"), they might be appended to product names.

**Suggestion:**
Add a whitelist validation before appending - only allow lines that contain alphabetic characters:
```typescript
if (currentProduct && line.length > 1) {
  // Must contain at least 2 alphabetic characters
  if (/[A-Za-zåäöÅÄÖéèüûôîâêëïÉÈÜÛÔÎÂÊËÏ].*[A-Za-zåäöÅÄÖéèüûôîâêëïÉÈÜÛÔÎÂÊËÏ]/.test(line) &&
      !line.match(/^(Moms|Netto|Brutto|Totalt|Kort|Erhållen|Avrundning|Betalningsinformation|Delavstämning|\\d+[,.]\\d+$)/) &&
      !line.match(/^\\d{10,}$/)) {
    currentProduct.name += ' ' + line;
```

---

### 🟢 LOW - Avrundning Could Create Negative Prices in Edge Case

**File:** `supabase/functions/parse-receipt/index.ts`  
**Line:** 980-989

**Issue:**
If `totalAmount < calculatedTotal` (receipt total is less than sum of items), the Avrundning item will have a negative price.

```typescript
const diff = totalAmount - calculatedTotal;
// If diff = -0.50, Avrundning item price = -0.50
```

**Risk:** Negative-priced Avrundning items may break UI assumptions or calculations.

**Suggestion:**
The code is technically correct (Swedish rounding can go either way), but add validation in UI/dashboard to handle negative Avrundning gracefully, or add absolute value with a descriptive name:
```typescript
items.push({
  name: diff > 0 ? 'Avrundning (tillägg)' : 'Avrundning (avdrag)',
  price: parseFloat(diff.toFixed(2)),
  quantity: 1,
  category: 'other'
});
```

---

### 🟢 LOW - Multi-buy Code Not Actually Used

**File:** `supabase/functions/parse-receipt/index.ts`  
**Line:** 906-920

**Issue:**
The multi-buy code (e.g., "4F30") is extracted but only logged, not used for price calculation.

```typescript
const multiBuyCode = multiBuyCodeMatch[2];
// ... only used in debug log
```

**Risk:** None currently, but the plan mentioned multi-buy offers should affect pricing. If future implementation needs the code, it's available.

**Suggestion:**
This is acceptable as-is since the receipt already has the discounted price. Document that multi-buy codes are informational only:
```typescript
// Multi-buy codes like "4F30" are informational only
// The receipt already includes the discounted price in the summa column
```

---

### 🟢 LOW - Error Response Changed from 500 to 200

**File:** `supabase/functions/parse-receipt/index.ts`  
**Line:** 2527

**Issue:**
Changed error response from HTTP 500 to HTTP 200 with error in JSON body.

```typescript
{ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
```

**Risk:** Clients may not detect errors if only checking HTTP status code, not JSON body.

**Suggestion:**
This follows the plan requirement. Ensure frontend checks for `error` field in response:
```typescript
const response = await fetch('/parse-receipt', ...);
const data = await response.json();
if (data.error) {
  // Handle error
}
```

---

### 🟢 LOW - Test Harness Has Duplicated Logic

**File:** `scripts/test-parser-local.ts`  
**Line:** 83-531

**Issue:**
Entire parser function duplicated from Edge Function (667 lines vs production file).

**Risk:** Test logic may drift from production if only one is updated.

**Suggestion:**
Add a comment at top of test file warning about keeping in sync:
```typescript
/**
 * ⚠️ IMPORTANT: This is a copy of parseICAKvantumText from index.ts
 * Any changes to parsing logic MUST be kept in sync with production code
 * 
 * TODO: Extract parser to shared module if drift becomes an issue
 */
```

---

## Pattern Adherence

✅ **TypeScript Types:** All new code properly typed  
✅ **Swedish Context:** Comments reference "öresavrundning"  
✅ **Error Handling:** Try-catch maintained  
✅ **Debug Logging:** Extensive logging for debugging  
✅ **Code Readability:** Clear comments explaining each pattern  

---

## Performance

✅ **No Performance Issues:** Changes are O(n) line processing, same as before  
✅ **No New Allocations:** Minimal memory overhead from regex matching  

---

## Security

✅ **No Security Issues:** No user input directly executed  
✅ **No Exposed Secrets:** No credentials in code  
✅ **Regex Safety:** All regex patterns are bounded (no catastrophic backtracking)  

---

## Logic Correctness

✅ **Multi-buy Pattern:** Regex correctly matches Swedish format "4F30"  
✅ **Greedy Capture:** Only appends when currentProduct exists  
✅ **Avrundning Logic:** Correctly handles small differences (0.01 < |diff| < 1.0)  
✅ **Error Handler:** Preserves error message in JSON response  

---

## Recommendations

1. **Add more footer patterns** to greedy capture exclusion list
2. **Document multi-buy code usage** (informational only)
3. **Add sync warning** to test harness
4. **Ensure frontend checks** `error` field in 200 responses
5. **Consider UI handling** for negative Avrundning items

---

## Overall Assessment

**Quality:** ✅ High  
**Readability:** ✅ Excellent  
**Test Coverage:** ✅ Good (3 test cases)  
**Risk Level:** 🟡 Low-Medium (greedy capture needs monitoring)

The implementation is solid with good defensive programming. Main risk is the greedy name capture being too aggressive, but this is mitigated by comprehensive logging for debugging.
