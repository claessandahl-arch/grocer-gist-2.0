# Structured Parsing Investigation Report

**Date:** 2025-12-29  
**Status:** Investigation paused - AI parser with optimizations is working  
**Priority:** Medium (for future optimization)

---

## Executive Summary

This document details the investigation into optimizing receipt parsing by using structured text parsing instead of AI (Gemini) for ICA receipts. The goal was to reduce parse time from ~138 seconds to near-instant parsing. While we achieved significant improvements with AI optimization (`reasoning_effort: 'none'`), the structured parser still has issues with ICA Kvantum receipts due to merged text fields in PDF extraction.

---

## Problem Statement

### Original Performance Issue
- **AI Parse Time:** ~138 seconds per receipt with Gemini 2.5 Flash (thinking mode enabled)
- **Goal:** Reduce to <5 seconds using structured parsing

### Root Cause Identified
The `parse-receipt` Edge Function has a structured parser for ICA receipts, but it was **not being used** because:
1. The parser checks for specific patterns in the extracted PDF text
2. ICA Kvantum PDFs have a **merged text format** that doesn't match the expected patterns

---

## Technical Findings

### 1. PDF Text Extraction Issue (ICA Kvantum)

When extracting text from ICA Kvantum PDFs using `pdf-parse`, fields are **merged without spaces**:

**Expected format:**
```
Gorgonz select 26%    2022015800000265    0,001,00 st    49,29
```

**Actual extracted text:**
```
Gorgonz select 26%2022015800000265,001,00 st49,29
```

**Key problems:**
- Article numbers merge directly with preceding text
- Prices merge directly with preceding text
- No clear field separators

### 2. Structured Parser Logic (parseICAReceiptText)

Location: `supabase/functions/parse-receipt/index.ts` (lines ~260-580)

**Current detection patterns:**
```typescript
// Looking for table headers
const tableHeaderPattern = /Artikelnummer|GTIN|Antal|Pris|Summa/i;

// Looking for article number patterns
const articleNumberPattern = /^\*?(.+?)\s+(\d{8,13})\s+/;
```

**Why it fails for ICA Kvantum:**
- The merged text `"Gorgonz select 26%2022015800000265"` doesn't match the pattern
- The regex expects whitespace between product name and article number

### 3. Attempted Fix (Reverted)

We attempted to add a regex pattern to handle merged formats:

```typescript
// NEW: Handle merged format where fields run together
const mergedPattern = /(\d{8,13})[\s,]*(\d+)[,.](\d+)\s*(st|kg)?\s*(\d+[,.]?\d*)/;
```

**Result:** Incomplete parsing - only captured 3 of 30+ items because:
- The regex was too fragile
- Edge cases in product names caused mismatches
- Some lines had different merge patterns

### 4. AI Optimization (Successful)

Instead of fixing the structured parser, we optimized the AI fallback:

```typescript
// Added to Gemini API call
reasoning_effort: 'none', // Disable thinking for faster responses
```

**Results:**
- Parse time reduced from **~138 seconds to ~27 seconds** (5x improvement)
- Reliable parsing of all receipt formats
- No code complexity added

---

## Rate Limiting Issues Encountered

### Gemini API Rate Limits

**Problem:** During testing, we hit 429 (Too Many Requests) errors from the Gemini API.

**Cause:** Free tier has strict per-minute rate limits

**Solution:** User switched to billing account with higher limits

**Code handling (already exists):**
```typescript
if (response.status === 429) {
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

---

## Orphaned Hash Problem

### Issue
When a 429 error occurred AFTER the image hash was saved but BEFORE the receipt was created, the hash remained in the database as an "orphan" (receipt_id = NULL).

### Impact
User couldn't re-upload the same receipt - duplicate detection blocked it.

### Current Code Flow (problematic):
```
1. Generate hash ✓
2. Check if hash exists ✓
3. Save hash immediately (with receipt_id = NULL) ← PROBLEM
4. Call AI parser... (429 error occurs)
5. Receipt never created
6. Hash remains orphaned
```

### Quick Fix Applied:
```sql
DELETE FROM receipt_image_hashes WHERE receipt_id IS NULL;
```

### Recommended Permanent Fix:
Change the flow to save hash AFTER receipt is successfully created:
```
1. Generate hash
2. Check if hash exists (for duplicate detection)
3. Call AI parser
4. Create receipt
5. Save hash WITH receipt_id
```

---

## Future Investigation Tasks

### Priority 1: Fix Structured Parser for ICA Kvantum

**Approach A: Better Regex Parsing**
- Study more ICA Kvantum PDF samples
- Identify all merge patterns
- Create more robust regex patterns
- Consider character position-based parsing

**Approach B: Alternative PDF Library**
- Try `pdfjs-dist` instead of `pdf-parse`
- Some libraries preserve layout better
- May extract text with proper spacing

**Approach C: Pre-processing**
- Add spaces before known article number patterns (13-digit barcodes)
- Normalize the text before parsing

### Priority 2: Improve Hash Handling

**Task:** Refactor to save hash only after receipt creation succeeds
- Move hash insert after `receipts.insert()`
- Pass `receipt_id` to hash insert
- Handle edge case where receipt exists but hash doesn't

### Priority 3: Retry Logic for Rate Limits

**Add exponential backoff:**
```typescript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    if (response.status !== 429) return response;
    await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
  }
  throw new Error('Rate limit exceeded after retries');
}
```

---

## Test Data

### ICA Kvantum Receipt Sample (problematic format)

**Filename:** `ICA Kvantum Kungens Kurva 2025-12-23.pdf`

**Extracted text sample (first 500 chars):**
```
ICA Kvantum
Kungens Kurva
...
Gorgonz select 26%2022015800000265,001,00 st49,29
Kokt Skinka2022015800012345,002,00 st35,90
...
```

**Expected parsing:**
- 30+ line items
- Total: ~2000 SEK
- Multiple discounts

**Actual structured parser result:** null (falls back to AI)

---

## Code Locations

| Component | File | Lines |
|-----------|------|-------|
| parseICAReceiptText | `supabase/functions/parse-receipt/index.ts` | 260-580 |
| parseWillysReceiptText | `supabase/functions/parse-receipt/index.ts` | 90-256 |
| Structured parser check | `supabase/functions/parse-receipt/index.ts` | 735-840 |
| Gemini API call | `supabase/functions/parse-receipt/index.ts` | 1226-1294 |
| Rate limit handling | `supabase/functions/parse-receipt/index.ts` | 1296-1314 |
| Hash generation | `src/lib/imageHash.ts` | 1-90 |
| Duplicate detection | `src/pages/Upload.tsx` | 196-245 |

---

## Conclusion

The AI parser with `reasoning_effort: 'none'` provides acceptable performance (~27s) for now. The structured parser optimization remains a valuable future improvement that could reduce parse time to <1 second for ICA receipts, but requires more investigation into the PDF text extraction format.

**Recommended next step:** Collect 5-10 different ICA Kvantum PDFs to analyze the text extraction patterns before attempting another fix.
