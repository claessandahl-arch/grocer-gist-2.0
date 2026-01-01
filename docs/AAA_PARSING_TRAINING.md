# AAA Receipt Parsing Training Feature

**Created:** January 1, 2026  
**Last Updated:** January 1, 2026  
**Status:** Phase 1-3 Complete ✅  
**Goal:** Build an intuitive training tool to achieve perfect ("AAA") receipt parsing

---

## Overview

This document outlines the plan for building a comprehensive receipt parsing training feature that allows:
- Iterative improvement of parsing with bug fixes
- Visual comparison of receipt image vs parsed results
- A/B testing between parser versions
- **NEW:** Side-by-side comparison of AI vs Structured parser results
- Safe transition from experimental to production parser

---

## What's Been Implemented ✅

### PR #8: Parser Versioning + Comparison Mode (Merged)

**Edge Function Changes:**
- Added `parserVersion` parameter to `parse-receipt` edge function
- Supports: `'current'` | `'experimental'` | `'ai_only'` | `'comparison'`
- Added `preprocessICAText()` function for experimental parser
  - Extended barcode regex from 8-13 → 8-16 digits (ICA Kvantum uses 14-16)
  - Inserts spaces before article numbers to fix merged fields
- Added `parseICAKvantumText()` - dedicated parser for table-based ICA Kvantum format
- Store type detection: Willys vs ICA vs ICA Kvantum
- Debug output includes `parserVersion` and raw PDF text on failure

**Training UI Changes:**
- Parser version dropdown selector in "Träning på inläsning" tab
- Visual badges showing which parser/version was used
- Color-coded debug log (green=success, red=fail, blue=info, yellow=headers)
- Debug log open by default with dark theme for readability
- Full PDF text shown when structured parsing fails (for debugging)

**Comparison Mode (Phase 3):**
- Added `'comparison'` parser version that runs BOTH parsers
- Implemented 4-pass item matching algorithm:
  1. Exact name + price match
  2. Fuzzy name match (>70% similarity using trigrams)
  3. Price match (same price, different name)
  4. Unmatched items (only in one parser)
- Returns `ComparisonResult` with diff metrics
- New `ComparisonView.tsx` component with:
  - Summary cards (item counts, timing, match rate, price accuracy)
  - Header comparison table (store, total, date)
  - Matched items with diff highlighting
  - Unmatched items sections (structured-only, AI-only)
  - Debug log viewer

**Files Modified:**
- `supabase/functions/parse-receipt/index.ts`
- `src/components/training/ParsingTrainer.tsx`
- `src/components/training/ComparisonView.tsx` (new)

### Bug Fixes Applied
- **RLS Storage Error:** Added user ID to storage path for temp files
- **ICA Kvantum Detection:** Now correctly identifies and routes to dedicated parser

---

## Current Architecture

### Parsing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      PARSING FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│  1. Receive request (imageUrls, pdfUrl, originalFilename)       │
│  2. Extract text from PDF using pdf-parse npm package           │
│  3. Detect store type (Willys vs ICA) from text patterns        │
│  4. TRY: Structured parser (parseWillysReceiptText/parseICA)    │
│     ├─ If items found → Use AI only for categorization          │
│     └─ If fails → Fall back to full AI parsing                  │
│  5. FALLBACK: Gemini 2.5 Flash with function calling            │
│     └─ reasoning_effort: 'none' for ~5x speed improvement       │
└─────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `supabase/functions/parse-receipt/index.ts` | Edge function with structured + AI parsers |
| `src/components/training/ParsingTrainer.tsx` | Training UI component |
| `src/pages/Upload.tsx` | Production upload flow |
| `docs/STRUCTURED_PARSING_INVESTIGATION.md` | Known parsing issues |

### Parser Components in Edge Function

| Function | Lines | Purpose |
|----------|-------|---------|
| `parseWillysReceiptText` | 50-258 | Structured parser for Willys self-scan |
| `preprocessICAText` | 268-295 | **NEW:** Pre-processes text to fix merged fields |
| `parseICAKvantumText` | 297-370 | **NEW:** Table-based parser for ICA Kvantum |
| `parseICAReceiptText` | 375-620 | Structured parser for standard ICA |
| Store detection logic | 840-860 | Routes to appropriate parser (now detects ICA Kvantum) |
| Gemini API call | 1000-1350 | AI fallback with detailed prompts |

---

## Known Pain Points

### 1. ICA Kvantum PDF Text Extraction Issue ✅ FIXED

PDF text extraction merges fields without spaces:

```
Original:  "Blåmusslor färska209193290000079,001,00 st316,00"
After fix: "Blåmusslor färska 209193290000079 ,001,00 st 316,00"
```

**Solution implemented:**
- `preprocessICAText()` inserts spaces before 8-16 digit article numbers
- `parseICAKvantumText()` handles the table format specifically

### 2. No Parser Versioning ✅ FIXED

~~Cannot test parser changes without affecting production~~

**Solution implemented:**
- `parserVersion` parameter: `'current'` | `'experimental'` | `'ai_only'`
- Production always uses `'current'`, training can use any version
- Debug output shows which version was used

### 3. Orphaned Hash Problem

Hash is saved BEFORE receipt creation. If parsing fails (429 error), hash remains orphaned, blocking re-upload.

**Status:** Not yet fixed

### 4. Slow AI Fallback

Even with `reasoning_effort: 'none'`, AI parsing takes ~10-27 seconds. Structured parser is <1 second.

**Mitigation:** ICA Kvantum parser now working, reduces AI fallback frequency.

---

## Implementation Plan

### Phase 1: Parser Versioning (Edge Function) ✅ COMPLETE

Added `parserVersion` parameter to edge function for A/B testing:

```typescript
// parse-receipt/index.ts - Request body
const { imageUrl, imageUrls, originalFilename, pdfUrl, parserVersion } = await req.json();
const selectedVersion = parserVersion || 'current';

// Supported versions:
// 'current'      - Production parser
// 'experimental' - With preprocessICAText() + parseICAKvantumText()
// 'ai_only'      - Skip structured parsing, go directly to Gemini
```

**Benefits:**
- ✅ Instant switching between parser versions
- ✅ No infrastructure changes needed
- ✅ Production uses default, training can use any version

---

### Phase 2: Enhanced Training UI ✅ COMPLETE

#### Current Implementation

Located in: `src/components/training/ParsingTrainer.tsx`  
Accessed via: Training page → "Träning på inläsning" tab

**Features implemented:**
1. ✅ Parser version dropdown selector
2. ✅ PDF/image upload with preview
3. ✅ Parse button triggers edge function
4. ✅ Results display with item list
5. ✅ Color-coded debug log with raw PDF text
6. ✅ Visual badges for parser method and version
7. ✅ Timing information

#### UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────┐  ┌──────────────────────────┐ │
│  │ Ladda upp testkvitto         │  │ Tolkningsresultat        │ │
│  │                              │  │                          │ │
│  │ Parser-version: [Dropdown ▼] │  │ Metod: [Strukturerad]    │ │
│  │ ├─ Current (Produktion)      │  │ Tid: 0.8s                │ │
│  │ ├─ Experimental              │  │                          │ │
│  │ ├─ Endast AI                 │  │ Butik: ICA Kvantum       │ │
│  │ └─ Jämför (AI vs Strukt) NEW │  │ Datum: 2025-12-30        │ │
│  │                              │  │ Total: 934.62 kr         │ │
│  │ ┌────────────────────────┐   │  │                          │ │
│  │ │                        │   │  │ Items (6):               │ │
│  │ │    KVITTO PREVIEW      │   │  │ ├─ Kammussla    209.72 kr│ │
│  │ │                        │   │  │ ├─ Kapris Små   26.95 kr │ │
│  │ └────────────────────────┘   │  │ └─ ...                   │ │
│  │                              │  │                          │ │
│  │ [Testa tolkning]             │  │ Debug-logg (expandable)  │ │
│  └──────────────────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

### Phase 3: Comparison Mode (AI vs Strukturerad) ✅ COMPLETE

**Goal:** Add a "Jämför" option that runs both structured parser AND AI parser in parallel, then displays a diff view showing matches, discrepancies, and missing items.

**Implementation completed January 1, 2026.**

#### A. Edge Function Changes

**New parserVersion option:**
```typescript
type ParserVersion = 'current' | 'experimental' | 'ai_only' | 'comparison';
```

**Comparison mode logic:**
```typescript
if (selectedVersion === 'comparison') {
  const startStructured = Date.now();
  
  // Run structured parser (experimental version for best results)
  const preprocessedText = preprocessICAText(rawPdfText);
  let structuredResult = null;
  
  if (isWillys) {
    structuredResult = parseWillysReceiptText(rawPdfText);
  } else if (isICAKvantum) {
    structuredResult = parseICAKvantumText(preprocessedText);
  } else {
    structuredResult = parseICAReceiptText(preprocessedText);
  }
  
  const structuredTime = Date.now() - startStructured;
  
  // Run AI parser
  const startAI = Date.now();
  const aiResult = await callGeminiAPI(imagesToProcess, pdfText, GEMINI_API_KEY);
  const aiTime = Date.now() - startAI;
  
  // Compute diff
  const diff = computeItemDiff(structuredResult?.items || [], aiResult.items);
  
  return new Response(JSON.stringify({
    mode: 'comparison',
    structured: structuredResult,
    ai: aiResult,
    diff: diff,
    timing: { structured: structuredTime, ai: aiTime },
    _debug: { method: 'comparison_mode', debugLog }
  }));
}
```

#### B. Diff Algorithm

**Item matching priority:**
1. Exact article number match
2. Exact name match (normalized: lowercase, trimmed)
3. Fuzzy name match (similarity > 70%)
4. Price + partial name match

**Diff data structure:**
```typescript
interface ItemDiff {
  structuredItem?: ParsedItem;
  aiItem?: ParsedItem;
  matchType: 'exact' | 'name_match' | 'fuzzy' | 'price_match' | 'unmatched';
  differences: {
    field: 'name' | 'price' | 'quantity' | 'category' | 'discount';
    structured: any;
    ai: any;
  }[];
}

interface ComparisonResult {
  mode: 'comparison';
  structured: SingleParseResult | null;
  ai: SingleParseResult;
  diff: {
    // Header comparison
    storeName: { structured: string; ai: string; match: boolean };
    totalAmount: { structured: number; ai: number; diff: number };
    receiptDate: { structured: string; ai: string; match: boolean };
    
    // Item comparison
    itemCount: { structured: number; ai: number };
    items: ItemDiff[];
    
    // Summary
    matchRate: number;              // % of items matched
    priceAccuracy: number;          // % of prices within 0.10 kr
    missingInStructured: ParsedItem[];
    missingInAI: ParsedItem[];
  };
  timing: { structured: number; ai: number };
}
```

#### C. UI Changes (ParsingTrainer.tsx)

**Add comparison option to dropdown:**
```tsx
<SelectItem value="comparison">
  <div className="flex items-center gap-2">
    <Badge variant="outline" className="bg-blue-50 text-blue-700">Jämför</Badge>
    <span>AI vs Strukturerad</span>
  </div>
</SelectItem>
```

**Comparison View Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  JÄMFÖRELSE: AI vs Strukturerad                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ SAMMANFATTNING ─────────────────────────────────────────────────────┐  │
│  │ Strukturerad: 6 items (0.8s) │ AI: 6 items (10.4s) │ Match: 100%     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ HEADER ─────────────────────────────────────────────────────────────┐  │
│  │              │ Strukturerad          │ AI                  │ Status  │  │
│  │ Butik        │ ICA Kvantum Liljeholm │ ICA Kvantum Lilj.  │ ✅      │  │
│  │ Total        │ 934.62 kr             │ 934.62 kr          │ ✅      │  │
│  │ Datum        │ 2025-12-30            │ 2025-12-30         │ ✅      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ PRODUKTER ──────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │ ✅ MATCHADE (6)                                                      │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ #  │ Strukturerad        │ AI                   │ Status       │  │  │
│  │ │ 1  │ Kammussla  209.72kr │ Kammussla   209.72kr │ ✅ Exakt     │  │  │
│  │ │ 2  │ Kapris Små  26.95kr │ Kapris Små   26.95kr │ ✅ Exakt     │  │  │
│  │ │ 3  │ Ostron 12   249.00kr│ Ostron 12-pack 249kr │ ⚠️ Namn      │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ ❌ ENDAST I AI (0)                                                   │  │
│  │ ❌ ENDAST I STRUKTURERAD (0)                                         │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ▶ Debug-logg (klicka för att expandera)                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### D. Implementation Checklist

**Edge Function:**
- [ ] Add `'comparison'` to parserVersion type
- [ ] Extract structured parsing into reusable function
- [ ] Extract AI parsing into reusable function
- [ ] Implement `computeItemDiff()` algorithm
- [ ] Return comparison response format

**Frontend:**
- [ ] Add `'comparison'` to ParserVersion type
- [ ] Add comparison option to dropdown
- [ ] Create `ComparisonResult` TypeScript interface
- [ ] Create `ComparisonView` component
- [ ] Style matched/unmatched/discrepancy rows
- [ ] Show timing comparison

---

### Phase 4: Test Case Library (Future)

#### Database Table

```sql
CREATE TABLE parser_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  store_type TEXT NOT NULL, -- 'ica_kvantum', 'ica_standard', 'willys'
  receipt_image_url TEXT NOT NULL,
  pdf_url TEXT,
  expected_store_name TEXT,
  expected_total NUMERIC(10,2),
  expected_date DATE,
  expected_items JSONB, -- Array of {name, price, quantity, category}
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Features

- Save test receipts with expected results
- Run regression tests against all saved cases
- Track accuracy over time

---

### Phase 5: Accuracy Dashboard (Future)

```
┌─────────────────────────────────────────────────────────────────┐
│           Parser Accuracy Report                                │
├─────────────────────────────────────────────────────────────────┤
│ Test Suite: ICA Kvantum (15 receipts)                           │
│                                                                 │
│ Parser Version    Items %   Total %   Speed    Status           │
│ ─────────────────────────────────────────────────────────────── │
│ Current (AI)      94.2%     98.0%     27.3s    ⚠️ Slow          │
│ Experimental      97.5%     99.0%     0.8s     ✅ Ready         │
│ v1 (Legacy)       82.1%     90.0%     0.5s     ❌ Deprecated    │
└─────────────────────────────────────────────────────────────────┘
```

**Metrics:**
- Item accuracy: % of items correctly parsed
- Total accuracy: % of receipts with correct total
- Parse time: Average time per receipt
- Status: Ready for production / needs work / deprecated

---

### Phase 7: ICA Kvantum Parser Deep Fix ✅ COMPLETE (January 1, 2026)

#### Problem Statement

The initial ICA Kvantum parser (Phase 6/PR #8) worked but had issues:
- Only found 37 items instead of 43
- Match rate: 76.7% vs AI parser
- Multi-line products split incorrectly
- Discounts not applied
- Pant (deposit) items missed

#### Root Causes Identified

| Issue | Root Cause |
|-------|------------|
| Debug logs didn't reach UI | Parser used `console.log()` not `debugLog` array |
| Quantity = 0 | Regex required digit-first, but field starts with comma |
| Discounts missed | Lines like `-40,80` had no text prefix |
| Pant = 0 | "Pant" header and values on separate lines |
| Products skipped | `ü` and `é` not in character class |
| Name corruption | Multi-line products appended as fallback |

#### Solution: Right-Anchored Parsing

Instead of parsing from left (corrupted by merged fields), parse from the right where format is reliable:

```typescript
// End of line is always reliable: "... st total"
const productEndMatch = line.match(/^(.+?)\s+st\s+(\d+[,.]\d+)$/);

// Extract quantity from merged junk like ",951,00"
// Pattern: junk + quantity + ,00 → e.g., ,95 + 1 + ,00
const qtyMatch = rawContent.match(/[,.](\d+)[,.]\d+$/);
```

#### Implementation Details

**7 patterns implemented in `parseICAKvantumText()`:**

| # | Pattern | Example |
|---|---------|---------|
| 1 | Right-anchored product | `Bananschalottenlök ... st 21,95` |
| 2 | Discount-only | `-40,80` |
| 3 | Brand + Discount | `OLW 4F89 -40,80` |
| 4 | Brand continuation | `Citroner 3F18` |
| 5 | Pant header (with optional `*`) | `Pant` or `*Pant` |
| 6 | Pant values | `2,0024,00` (merged) |
| 7 | Full Pant line | `Pant 2,00 2 4,00` |
| 8 | Orphan Pant values | `1,0011,00` (no header detected) |

**Extended character support:**
```typescript
// Added: éèüûôîâêëïÉÈÜÛÔÎÂÊËÏ
// Handles: F-müsli, Laxfilé, etc.
```

#### Results

**Test 1 (ICA Kvantum Kungens Kurva - 2025-12-29):**
| Metric | Before | After |
|--------|--------|-------|
| Products Found | 37 → 4 | **43/43** |
| Match Rate | 76.7% → 9.3% | **100%** |
| Parse Time | — | **2ms** |

**Test 2 (ICA Kvantum Kungens Kurva - 2025-12-30):**
| Metric | Before | After |
|--------|--------|-------|
| Products Found | 30 | **32/32** |
| Match Rate | 93.8% | **100%** |
| Parse Time | — | **1ms** |
| Lines Skipped | 4 | **0** |

#### Commits

1. `feat: Enhanced parser debug logging and ICA Kvantum multi-line support`
2. `fix: ICA Kvantum parser with right-anchored strategy`
3. `fix: Handle comma-prefixed quantity field in ICA Kvantum parser`
4. `fix: Add orphan Pant values detection (Pattern 8)`
5. `fix: Handle *Pant format (asterisk prefix on Pant lines)`

#### Known Limitations

1. **Bundle discounts** - Multi-buy discounts (e.g., "4 chips for 89kr") are applied to the last item only, which can result in negative individual prices. The **total is still correct** for receipt purposes.

2. **Weight-based products (kg)** - Products sold by weight use `kg` instead of `st`. Current pattern only matches `st` unit.
   - Example: `Julskinka rimmad ... 2,91 kg 320,10` is skipped
   - **Future fix:** Add pattern for `kg` unit with weight extraction

3. **Receipt-level coupons** - Coupons like "Värdekupong 10%" at the end of the receipt are incorrectly treated as name continuations for the previous product.
   - Example: "Ägg 12-p Rosa L" gets corrupted to "Ägg 12-p Rosa L Värdekupong 10%" with -353.52 kr discount
   - **Future fix:** Detect "Värdekupong", "Kupong", "Rabatt" lines as separate discount items

---

### ICA Kvantum Parser Fix (Original - PR #8)

#### Problem Solved
ICA Kvantum receipts had merged fields like:
```
Gorgonz select 26%2022015800000265,001,00 st49,29
```
Article numbers are 14-16 digits (not 8-13), causing regex failures.

#### Solution: Pre-processing Text + Dedicated Parser

**1. preprocessICAText() - Fix merged fields:**
```typescript
function preprocessICAText(text: string): string {
  let processed = text;
  
  // Insert space before 8-16 digit article numbers
  processed = processed.replace(/([a-zA-ZåäöÅÄÖ%])(\d{8,16})/g, '$1 $2');
  
  // Insert space before price patterns: "st49,29" → "st 49,29"
  processed = processed.replace(/(st|kg|l|ml|g)(\d+[,.]?\d*)\s*$/gm, '$1 $2');
  
  // Insert space after article numbers: "123456789,00" → "123456789 ,00"
  processed = processed.replace(/(\d{8,16})([,.])/g, '$1 $2');
  
  return processed;
}
```

**2. parseICAKvantumText() - Table format parser:**
- Detects ICA Kvantum by "Kvantum" + "Beskrivning" in text
- Matches pattern: `ProductName ArticleNumber [UnitPrice] Quantity Unit Summa`
- Handles 14-16 digit barcodes specific to ICA Kvantum

---

### Phase 6: Production Transition (Future)

#### Graduation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARSER GRADUATION PIPELINE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DEVELOPMENT                                                 │
│     └─ Code changes in experimental parser                      │
│     └─ Test in ParsingTrainer UI                                │
│                                                                 │
│  2. VALIDATION                                                  │
│     └─ Run against test case library                            │
│     └─ Compare accuracy vs current production parser            │
│     └─ Require: ≥95% item accuracy, ≥99% total accuracy         │
│                                                                 │
│  3. SHADOW MODE (optional)                                      │
│     └─ Run both parsers on real uploads                         │
│     └─ Log differences for analysis                             │
│     └─ Don't save experimental results                          │
│                                                                 │
│  4. PROMOTION                                                   │
│     └─ Update DEFAULT_VERSION to 'experimental'                 │
│     └─ Rename: experimental → current, current → v{N}           │
│     └─ Deploy updated edge function                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Safety Checklist Before Production Switch

- [ ] Run experimental parser against 100% of test case library
- [ ] Accuracy ≥ current parser on all metrics
- [ ] No regressions on Willys receipts
- [ ] Performance acceptable (<30s for AI, <2s for structured)
- [ ] Orphan hash fix deployed
- [ ] Rate limit retry logic in place
- [ ] Rollback plan documented

---

## Implementation Order

| Priority | Task | Effort | Impact | Status |
|----------|------|--------|--------|--------|
| 1 | Add `parserVersion` parameter to edge function | Low | High | ✅ Done |
| 2 | Add parser selector dropdown to ParsingTrainer | Low | High | ✅ Done |
| 3 | Fix RLS storage paths (add userId) | Low | High | ✅ Done |
| 4 | Fix ICA Kvantum merged field parsing | High | High | ✅ Done |
| 5 | Add comparison mode (run 2 parsers at once) | Medium | High | ✅ Done |
| 6 | Create test case storage table | Low | Medium | Not started |
| 7 | Build accuracy scoring dashboard | Medium | Medium | Not started |
| 8 | Fix orphan hash problem | Low | Medium | Not started |
| 9 | Add retry logic for 429 errors | Low | Medium | Not started |
| 10 | Build manual correction interface | High | Low | Not started |

---

## Open Questions

1. **Start order:** Edge function versioning first (UI depends on it) or UI improvements first?
   - **Decision:** ✅ Edge function first - Done

2. **Test case library scope:** Start with 5-10 receipts or collect more samples first?
   - **Recommendation:** Start with 5-10 covering ICA Kvantum, ICA standard, Willys

3. **Shadow mode:** Log both parser results on real uploads for comparison?
   - **Recommendation:** Yes, useful for measuring real-world accuracy before switching
   - **Note:** Comparison mode in Training UI provides similar value for manual testing

4. **ICA Kvantum article numbers:** 8-13 digit or longer?
   - **Decision:** ✅ Extended to 8-16 digits (ICA Kvantum uses 14-16 digit barcodes)

---

## Progress Tracking

### ✅ Completed (Merged to main)
- [x] Initial ParsingTrainer component (PR #7)
- [x] Basic upload and parsing functionality
- [x] Debug log viewer with dark theme + color-coded output
- [x] Parser versioning in edge function (`current`, `experimental`, `ai_only`, `comparison`)
- [x] Parser selector dropdown in Training UI
- [x] `preprocessICAText()` - Fix merged fields with 8-16 digit regex
- [x] `parseICAKvantumText()` - Dedicated table-based parser for ICA Kvantum
- [x] Visual badges showing parser version in results
- [x] RLS-compliant storage paths (userId prefix)
- [x] Raw PDF text debug output on parse failure
- [x] **Comparison mode** - Run both parsers, show diff (Phase 3)
- [x] `ComparisonView.tsx` - Side-by-side results with match highlighting
- [x] 4-pass item diff algorithm (exact, fuzzy, price, unmatched)
- [x] Summary metrics (match rate, price accuracy, timing)

### ✅ Completed (Phase 7 - January 1, 2026)
- [x] Debug logs flow to Training UI (pass `debugLog` array to parsers)
- [x] Right-anchored parsing strategy for reliable extraction
- [x] Discount-only line handling (`-40,80`)
- [x] Pant state machine (split across 2 lines)
- [x] Extended character support (`éèüûôîâêëï`)
- [x] Multi-line product/brand handling
- [x] Quantity extraction from merged junk (`,951,00` → qty=1)
- [x] **100% match rate** with AI parser (43/43 items)
- [x] **2ms parse time** (vs AI 19,000ms)

### 🔜 Next Up (Phase 4-6)
- [ ] Test case library database
- [ ] Accuracy dashboard
- [ ] Production transition mechanism

### Known Issues (Lower Priority)
- [ ] Orphan hash fix
- [ ] 429 retry logic
- [ ] Bundle discounts applied to single item (total still correct)

