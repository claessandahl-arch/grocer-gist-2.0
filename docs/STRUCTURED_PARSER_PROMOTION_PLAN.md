# Structured Parser Production Promotion Plan

**Created:** 2026-01-06  
**Status:** 🔶 Pending — Requires 100% parser accuracy before promotion  
**Goal:** Make structured parser the default for all production receipt uploads

---

## Executive Summary

The structured parser (`experimental` version) works excellently in the Training UI but is **not used in production uploads**. Production falls back to slow AI parsing for most ICA receipts.

**Impact:**
- Production: ~10-27 seconds per ICA receipt (AI)
- Training: ~2ms per ICA receipt (structured)

This document outlines the plan to "promote" the experimental parser to production.

---

## Current State

### Parser Version Behavior

| Version | Route | ICA Kvantum Support |
|---------|-------|---------------------|
| `'current'` (production default) | `parseICAReceiptText()` only | ❌ No |
| `'experimental'` (training) | `preprocessICAText()` + `parseICAKvantumText()` | ✅ Yes |
| `'ai_only'` | Skip structured, use Gemini | N/A |
| `'comparison'` | Both parsers side-by-side | ✅ Yes |

### Code Location

**File:** `supabase/functions/parse-receipt/index.ts`
**Lines:** 1675-1680

```typescript
} else {
  // Current (production) parser ← PROBLEM
  structuredResult = isWillys
    ? parseWillysReceiptText(rawPdfText, debugLog)
    : parseICAReceiptText(rawPdfText, debugLog);  // No ICA Kvantum!
}
```

---

## What Needs to Change

### 1. Promote ICA Table Format Parser

Make production use the same code path as experimental:

```typescript
// Before (current)
if (selectedVersion === 'experimental' || isComparisonMode || isStructuredOnly) {
  // Good parser with preprocessing
} else {
  // Old parser without ICA Kvantum support
}

// After (proposed)
// All versions use improved parser
const preprocessedText = preprocessICAText(rawPdfText);
if (isWillys) {
  structuredResult = parseWillysReceiptText(rawPdfText, debugLog);
} else if (isICATableFormat) {
  structuredResult = parseICAKvantumText(preprocessedText, debugLog);
} else {
  structuredResult = parseICAReceiptText(preprocessedText, debugLog);
}
```

### 2. Remove Version Gating

Currently the best parser is hidden behind `selectedVersion === 'experimental'`. This should be the default for everyone.

---

## Prerequisite: 100% Parser Accuracy

Before promoting to production, we need to verify:

1. **All ICA formats work:**
   - ICA Kvantum
   - ICA Nära
   - Maxi ICA
   - ICA Supermarket

2. **No regressions:**
   - Run bulk tester with all test receipts
   - Compare structured vs AI results
   - Ensure 100% match rate

3. **Edge cases handled:**
   - Bundle discounts
   - Multi-line product names
   - Weighted items (kg)
   - Pantretur (bottle deposits)

### Testing Protocol

1. Use `/training` with "Jämför (AI vs Strukturerad)" mode
2. Upload all saved test receipts
3. Verify `matchRate: 100%` and `priceAccuracy: 100%`
4. Document any discrepancies

---

## Implementation Steps

### Step 1: Validate Parser (Current Phase)

- [ ] Collect test receipts from all ICA store types
- [ ] Run comparison mode on each
- [ ] Fix any discrepancies
- [ ] Achieve 100% match rate

### Step 2: Promote Parser (After Validation)

- [ ] Remove version gating in `parse-receipt/index.ts`
- [ ] Make ICA Kvantum parser the default for table format
- [ ] Deploy Edge Function
- [ ] Update documentation

### Step 3: Monitor

- [ ] Check production logs for parser fallbacks
- [ ] Monitor parsing times (should be ~2ms, not ~27s)
- [ ] Edge cases reported by users

---

## Related Documentation

- [`docs/AAA_PARSING_TRAINING.md`](AAA_PARSING_TRAINING.md) — Parser training feature documentation
- [`docs/STRUCTURED_PARSING_INVESTIGATION.md`](STRUCTURED_PARSING_INVESTIGATION.md) — Parsing issues and fixes
- [`TODO.md`](../TODO.md) — Project task list

---

## Version History

| Date | Change |
|------|--------|
| 2026-01-06 | Initial plan created, pending validation |
