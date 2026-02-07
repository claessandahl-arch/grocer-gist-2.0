# Implementation Plan - Fix Structured Parser Item Merge Error

**Feature:** fix-structured-parser-merge  
**Date:** 2026-02-07  
**Status:** Planning  

## User Story

As a user reviewing my grocery receipts, I want item quantities and prices to be correctly parsed so that the price comparison feature shows accurate unit prices.

## Bug Description

**Receipt:** ICA Kvantum Kungens Kurva 2026-02-05  
**Symptom:** Item "Sunny Soda Nocco2F38" shows `52 st × 34.1 kr = 0.66:-/st`  
**Expected:** Should be `2 st × 19,05 kr` based on receipt table

## Root Cause Analysis

### The Core Problem

The ICA Kvantum parser (`parseICAKvantumText` in `supabase/functions/parse-receipt/index.ts`) extracts quantity from a merged text field using a regex that can capture incorrect digits.

### Detailed Trace

1. **Input Line Format:**
   ```
   *Sunny Soda 734013160216623 ,952,00 st 45,90
   ```
   The `,952,00` is a merged form of:
   - Price decimals: `,95` (from unit price 22,95 or similar)
   - Quantity: `2,00` (2 items)

2. **Current Regex (line 566):**
   ```typescript
   const qtyMatch = rawContent.match(/[,.](\d+)[,.](\d+)$/);
   ```
   
3. **Bug Scenario:**
   When the merge produces `,052,00` (e.g., from price `19,05` + qty `2,00`):
   - Regex captures: `qtyMatch[1] = "052"`, `qtyMatch[2] = "00"`
   - `parseInt("052") = 52`
   - Sanity check `52 < 100` **passes**
   - Quantity incorrectly set to 52

4. **Result:**
   - Stored quantity: 52
   - Stored price: 34.1 kr (after discount)
   - Calculated unit_price: 34.1 / 52 = 0.66 kr (obviously wrong!)

### Why the Sanity Check Fails

The current sanity check (`extractedQty > 0 && extractedQty < 100`) is too permissive:
- It allows quantities like 52 when the leading "0" from price decimals merges with quantity
- Real grocery quantities are typically 1-20, rarely exceeding 30

## Technical Approach

### Fix Strategy: Unit Price Sanity Check

Add a validation step that checks if the calculated unit price is reasonable:

1. **Calculate unit price:** `unitPrice = total / quantity`
2. **Validate:** If `unitPrice < 1 kr`, the quantity is likely wrong
3. **Fallback:** Reset to quantity = 1 (most common case)

### Alternative Strategy: Improved Regex Pattern

Better separate the merged price decimals from quantity:
- Pattern: `/,(\d{2})(\d+),(\d{2})$/` to capture price decimals vs quantity digits
- More targeted extraction for the specific merge pattern

### Chosen Approach: Unit Price Sanity Check

Rationale:
- Simpler to implement and reason about
- Works for all merge patterns, not just specific digit combinations
- Groceries rarely cost less than 1 kr per unit (except bulk items which use 'kg')
- The 'kg' unit already has separate handling

## Step-by-Step Implementation

### Phase 1: Add Unit Price Sanity Check

- [ ] **Step 1.1:** In `parseICAKvantumText` function, after extracting quantity at line ~575
- [ ] **Step 1.2:** Calculate implied unit price: `const impliedUnitPrice = total / quantity`
- [ ] **Step 1.3:** Add sanity check: if `impliedUnitPrice < 1` for 'st' items, log warning and reset `quantity = 1`
- [ ] **Step 1.4:** Strengthen the existing sanity check: change `< 100` to `< 30` (more realistic max)

### Phase 2: Improve Quantity Regex (Optional Enhancement)

- [ ] **Step 2.1:** Add alternative regex to better handle merged price+quantity patterns
- [ ] **Step 2.2:** Pattern: Look for `\d{1,2}(?:,00|,\d{2})$` at end to capture quantity more precisely

### Phase 3: Add Logging for Investigation

- [ ] **Step 3.1:** Add debug log when sanity check triggers
- [ ] **Step 3.2:** Log the raw extracted value vs corrected value

### Phase 4: Verification

- [ ] **Step 4.1:** Run `npm run build` to verify no type errors
- [ ] **Step 4.2:** Manually test with the problematic receipt (ICA Kvantum 2026-02-05) if available
- [ ] **Step 4.3:** Run bulk test to ensure no regressions

## Code Changes

### File: `supabase/functions/parse-receipt/index.ts`

**Location:** Lines 565-578 (quantity extraction in `parseICAKvantumText`)

**Current Code:**
```typescript
let quantity = 1; // default
const qtyMatch = rawContent.match(/[,.](\d+)[,.](\d+)$/);
if (qtyMatch) {
  if (unit === 'kg') {
    quantity = parseFloat(`${qtyMatch[1]}.${qtyMatch[2]}`);
  } else {
    // For st, quantity is just the integer before the decimals
    const extractedQty = parseInt(qtyMatch[1]);
    if (extractedQty > 0 && extractedQty < 100) { // sanity check
      quantity = extractedQty;
    }
  }
}
```

**Proposed Change:**
```typescript
let quantity = 1; // default
const qtyMatch = rawContent.match(/[,.](\d+)[,.](\d+)$/);
if (qtyMatch) {
  if (unit === 'kg') {
    quantity = parseFloat(`${qtyMatch[1]}.${qtyMatch[2]}`);
  } else {
    // For st, quantity is just the integer before the decimals
    const extractedQty = parseInt(qtyMatch[1]);
    // Tightened sanity check: realistic grocery quantities are 1-30
    if (extractedQty > 0 && extractedQty < 30) {
      // Additional validation: unit price should be >= 1 kr for 'st' items
      const impliedUnitPrice = total / extractedQty;
      if (impliedUnitPrice >= 1) {
        quantity = extractedQty;
      } else {
        // Unit price too low - quantity extraction likely grabbed garbage digits
        debugLog.push(`    ⚠️ Qty sanity fail: ${extractedQty} gives ${impliedUnitPrice.toFixed(2)} kr/st - using qty=1`);
      }
    }
  }
}
```

## Test Cases

### Test Case 1: Bug Reproduction
**Input:** Line with merged `,052,00` pattern  
**Expected:** quantity=1 (not 52), reasonable unit price

### Test Case 2: Valid High Quantity  
**Input:** Line with actual quantity of 10  
**Expected:** quantity=10, valid unit price

### Test Case 3: Regression Check
**Input:** Existing working receipts from bulk test  
**Expected:** No change in parsing results

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaks valid high-quantity items | Medium | Keep threshold at 30 (reasonable for groceries) |
| Unit price check too aggressive | Low | Only apply to 'st' items, not 'kg' |
| Edge case: items that cost < 1 kr | Low | Very rare for Swedish groceries by unit |

## Definition of Done

- [ ] Code changes implemented
- [ ] `npm run build` passes
- [ ] Bulk test shows no regressions
- [ ] Bug symptom (52 st × 0.66 kr) no longer occurs
- [ ] Changes committed and PR created

## References

- **Bug Report:** TODO.md line 66-71
- **Parser Function:** `parseICAKvantumText` at line 458
- **Quantity Extraction:** Lines 565-578
- **Test Logs:** `tmp/bulk-test-logs-1770481895757.md`
