# Feature: Fix 2F25 Discount Parsing

## Description

The `parseICAKvantumText` function in the receipt parser incorrectly handles Swedish multi-buy discount patterns (e.g., "2F25" meaning "2 for 25 kr"). Currently, it subtracts the discount amount from the price, yielding incorrect values like 8.10 kr instead of the bundle price of 25.00 kr.

## User Story

As a **Grocer Gist user** importing ICA receipts,  
I want **multi-buy bundle discounts to be correctly parsed**,  
So that **my spending analysis accurately reflects what I paid**.

## Complexity Assessment

**Complexity:** Low-Medium  
**Estimated Effort:** 1-2 hours  
**Risk Level:** Low (isolated change to Pattern 3, with existing regression tests)

---

## Technical Analysis

### Root Cause

Pattern 3 in `parseICAKvantumText` (lines 796-817 of `supabase/functions/parse-receipt/index.ts`):

```typescript
// Current behavior (WRONG):
currentProduct.name += ' ' + brandText;  // "Energidryck 2F25"
currentProduct.discount += discount;     // 33.80
currentProduct.price -= discount;        // 41.90 - 33.80 = 8.10 ❌
```

The code treats "2F25" as plain text instead of interpreting it as "2 for 25 kr".

### Existing Solution (Reference)

Lines 1293-1360 already have correct multi-buy handling:
```typescript
const offerPattern = /^(.+?)\s*(\d+)\s*(?:för|f|\/)\s*(\d+[,.]?\d*)(?:kr)?$/i;
// Calculates: finalPrice = bundlePrice, discount = original - bundlePrice
```

This proven pattern should be adapted for Pattern 3.

---

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `supabase/functions/parse-receipt/index.ts` | MODIFY | Add multi-buy detection in Pattern 3 (lines 800-817) |
| `scripts/test-2f25-discount.ts` | NEW | Targeted unit test for multi-buy parsing |
| `test-receipts/golden-set/golden-set-index.json` | MODIFY | Add receipt with 2F25 pattern to golden set |

---

## Step-by-Step Tasks

### Phase 1: Implementation

- [ ] **1.1** Review current Pattern 3 code (lines 796-817)
- [ ] **1.2** Add multi-buy offer detection regex after `brandText` extraction:
  ```typescript
  const offerPattern = /^(.+?)\s*(\d+)\s*(?:för|f|\/)\s*(\d+[,.]?\d*)(?:kr)?$/i;
  const multiBuyMatch = brandText.match(offerPattern);
  ```
- [ ] **1.3** Add conditional branch for multi-buy handling:
  - Set `currentProduct.price = bundlePrice`
  - Calculate `discount = originalPrice - bundlePrice`
  - Optionally update quantity to match bundle
- [ ] **1.4** Preserve original behavior for non-multi-buy discount lines

### Phase 2: Testing

- [ ] **2.1** Create `scripts/test-2f25-discount.ts` with hardcoded test cases
- [ ] **2.2** Run regression tests: `npm run test:regression`
- [ ] **2.3** Deploy Edge Function to production: `supabase functions deploy parse-receipt`
- [ ] **2.4** Test with real receipt upload on localhost:8080

### Phase 3: Finalize

- [ ] **3.1** Add a real 2F25 receipt PDF to golden set (if available)
- [ ] **3.2** Run full validation: `npm run build`
- [ ] **3.3** Commit changes following convention

---

## Testing Strategy

### 1. Existing Regression Tests

**Command:**
```bash
npm run test:regression
```

This runs `scripts/test-parser-regression.ts` against receipts in `test-receipts/golden-set/`. Ensures no regression in existing parsing.

### 2. New Targeted Unit Test

**File:** `scripts/test-2f25-discount.ts`

**Command:**
```bash
npx tsx scripts/test-2f25-discount.ts
```

**Test Cases:**
| Input | Expected Price | Expected Quantity | Expected Discount |
|-------|----------------|-------------------|-------------------|
| `*Kiwi Guava... 41,90` + `Energidryck 2F25 -33,80` | 25.00 | 2 | 16.90 |
| `*OLW Chips... 89,00` + `OLW 4F89 -40,80` | 89.00 | 4 | ~0 |
| `*Äpplen... 18,00` + `Frukt 3F27 -9,00` | 27.00 | 3 | ~0 (or calculate) |

### 3. Manual Verification

1. Start dev server: `npm run dev`
2. Navigate to localhost:8080
3. Upload a real receipt containing a "2F25" or similar multi-buy offer
4. Check receipt detail view:
   - Price should show bundle price (e.g., 25.00 kr)
   - Not the subtracted value (e.g., 8.10 kr)

---

## Validation Commands

```bash
# Type check
npx tsc --noEmit

# Linting
npm run lint

# Full build
npm run build

# Regression tests (requires Supabase connection)
npm run test:regression
```

---

## Acceptance Criteria

- [ ] Multi-buy codes (2F25, 3F45, 4F89, etc.) are correctly parsed
- [ ] Bundle price is used as final price, not the subtracted discount
- [ ] Existing non-multi-buy discounts continue to work
- [ ] All existing regression tests pass
- [ ] New unit test passes for the specific 2F25 case
- [ ] Build completes without errors

---

## Risk Assessment

> [!WARNING]
> This change **ignores receipt math** when a multi-buy code is detected. We trust the multi-buy code as the source of truth for final price.

**Edge Cases to Monitor:**
- Multi-buy codes that look like article numbers (e.g., "2525")
- Different formats: "2för25", "2/25", "2f25", "2F25"
- Products where quantity on receipt doesn't match bundle quantity
