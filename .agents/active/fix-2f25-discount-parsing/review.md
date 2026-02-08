# Code Review: 2F25 Multi-Buy Discount Parsing Fix

## Overview
Reviewed 3 modified files and 1 new file for logic errors, security issues, performance concerns, and code quality.

---

## Issues Found

### 1. Logic Error: Negative Discount Handling

**severity**: high  
**file**: `supabase/functions/parse-receipt/index.ts`  
**line**: 851  
**issue**: When `originalPrice < bundlePrice`, the `actualDiscount` becomes negative, which could produce incorrect discount values. Example: Test case "3F27 pattern" has `originalPrice = 18.00`, `bundlePrice = 27.00`, resulting in `actualDiscount = -9.00`.

**suggestion**: Add validation to prevent negative discounts:
```typescript
const actualDiscount = Math.max(0, parseFloat((originalPrice - bundlePrice).toFixed(2)));
```

---

### 2. Logic Error: Test Case Expectations Incorrect

**severity**: high  
**file**: `scripts/test-2f25-discount.ts`  
**line**: 35-47  
**issue**: Two test cases have incorrect expected values:
- **4F89 test**: `expectedPrice: 89.00, expectedDiscount: 0.00` - If original price is 89.00 and bundle is 89.00, this is correct and not actually a multi-buy (no discount).
- **3F27 test**: `expectedPrice: 27.00, expectedDiscount: 0.00` - Original price is 18.00, but expects 27.00, which means price *increased*. This shouldn't happen in real receipts.

**suggestion**: 
1. For 4F89 test: This should probably have a different original price (e.g., 32.25 per item × 4 = 129.00) to demonstrate actual bundle savings
2. For 3F27 test: Either fix the original price to be higher (e.g., 36.00 for 3 items), or clarify this is an edge case test

---

### 3. Code Duplication: Regex Pattern Repeated

**severity**: medium  
**file**: `supabase/functions/parse-receipt/index.ts`  
**lines**: 786, 835  
**issue**: The offer pattern regex is defined twice: once at line 786 and again at line 835. This violates DRY principle.

**suggestion**: Define the pattern once at the top of the function:
```typescript
// At top of parseICAKvantumText function (around line 424)
const MULTI_BUY_PATTERN = /(\d+)\s*(?:för|f|\/)\s*(\d+[,.]?\d*)(?:kr)?/i;
```

Then reference it in both locations:
```typescript
const multiBuyInName = currentProduct.name.match(MULTI_BUY_PATTERN);
// ...
const multiBuyMatch = brandText.match(/^(.+?)\s*${MULTI_BUY_PATTERN.source}$/i);
```

---

### 4. Performance: Regex Compiled Multiple Times

**severity**: low  
**file**: `supabase/functions/parse-receipt/index.ts`  
**lines**: 786, 835  
**issue**: Regex patterns are compiled on every iteration of the loop. For large receipts (100+ lines), this adds unnecessary overhead.

**suggestion**: Move regex compilation outside the loop (see suggestion #3).

---

### 5. Code Quality: Whitespace-Only Changes

**severity**: low  
**file**: `scripts/test-parser-regression.ts`  
**lines**: multiple  
**issue**: The diff shows many whitespace-only changes (trailing spaces removed, indentation adjusted). While good for consistency, these pollute the git history and make it harder to see the meaningful change (line 48).

**suggestion**: 
- Commit functional changes separately from formatting changes
- Consider adding a `.editorconfig` file to enforce consistent formatting
- Or use `git diff -w` to ignore whitespace when reviewing

---

### 6. Missing Error Handling: Division by Zero

**severity**: low  
**file**: `supabase/functions/parse-receipt/index.ts`  
**lines**: 839, 852  
**issue**: `parseInt(multiBuyMatch[2])` could theoretically be 0 in malformed input (e.g., "0F25"), though unlikely in real receipts. The `bundleQty` is logged but never validated.

**suggestion**: Add validation:
```typescript
const bundleQty = parseInt(multiBuyMatch[2]);
if (bundleQty <= 0 || isNaN(bundleQty)) {
  // Fall through to regular discount logic
  continue;
}
```

---

### 7. Code Quality: Magic Number in Test

**severity**: low  
**file**: `scripts/test-2f25-discount.ts`  
**line**: 24  
**issue**: Expected discount `16.90` is a magic number. The calculation should be documented: `(41.90 - 25.00) = 16.90`.

**suggestion**: Add comment explaining the math:
```typescript
expectedDiscount: 16.90, // Original 41.90 - Bundle 25.00
```

---

## Pattern Adherence

✅ **Follows AGENTS.md**: Structured parser modification, no database changes  
✅ **TypeScript**: Proper typing, no `any` types introduced  
✅ **Testing**: Targeted test coverage included  
⚠️ **Documentation**: Changes not yet documented in parser comments  

---

## Security Issues

✅ No security concerns identified:
- No user input directly used in patterns
- No SQL injection vectors (uses Supabase SDK)
- No secrets exposed
- No XSS vulnerabilities

---

## Performance Considerations

✅ **Good**: Changes are O(1) operations on each line  
⚠️ **Minor**: Regex compilation in loop (see issue #4)  
✅ **Good**: No N+1 query patterns  

---

## Summary

**Total Issues**: 7 (1 high, 1 high, 1 medium, 4 low)

**Critical**: Fix negative discount logic and test case expectations before deployment.

**Recommended Actions**:
1. Add `Math.max(0, ...)` to prevent negative discounts
2. Fix test case expected values or document edge case behavior  
3. Extract regex pattern to constant
4. Consider separating whitespace changes from functional changes in git history

**Overall Assessment**: The core fix is sound and addresses the root cause. The main concerns are edge case handling (negative bundles) and test accuracy.
