# AAA Receipt Parsing Training Feature

**Created:** January 1, 2026  
**Status:** Planning  
**Goal:** Build an intuitive training tool to achieve perfect ("AAA") receipt parsing

---

## Overview

This document outlines the plan for building a comprehensive receipt parsing training feature that allows:
- Iterative improvement of parsing with bug fixes
- Visual comparison of receipt image vs parsed results
- A/B testing between parser versions
- Safe transition from experimental to production parser

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
| `parseICAReceiptText` | 260-580 | Structured parser for ICA (broken for Kvantum) |
| Store detection logic | 735-840 | Routes to appropriate parser |
| Gemini API call | 1226-1294 | AI fallback with detailed prompts |

---

## Known Pain Points

### 1. ICA Kvantum PDF Text Extraction Issue

PDF text extraction merges fields without spaces:

```
Expected: "Gorgonz select 26%    2022015800000265    0,001,00 st    49,29"
Actual:   "Gorgonz select 26%2022015800000265,001,00 st49,29"
```

**Impact:** Regex patterns fail, falls back to slower AI parser (~27s vs <1s)

### 2. No Parser Versioning

- Cannot test parser changes without affecting production
- Cannot compare old vs new parser on same receipt
- No rollback capability

### 3. Orphaned Hash Problem

Hash is saved BEFORE receipt creation. If parsing fails (429 error), hash remains orphaned, blocking re-upload.

### 4. Slow AI Fallback

Even with `reasoning_effort: 'none'`, AI parsing takes ~27 seconds. Structured parser would be <1 second.

---

## Implementation Plan

### Phase 1: Parser Versioning (Edge Function)

Add `parserVersion` parameter to edge function for A/B testing:

```typescript
// parse-receipt/index.ts

const PARSER_VERSIONS = {
  'v1': {
    name: 'Legacy Structured',
    ica: parseICAReceiptTextV1,
    willys: parseWillysReceiptTextV1,
  },
  'current': {
    name: 'Current Production',
    ica: parseICAReceiptText,
    willys: parseWillysReceiptText,
  },
  'experimental': {
    name: 'Experimental (Merged Field Fix)',
    ica: parseICAReceiptTextExperimental,
    willys: parseWillysReceiptText,
  },
};

const DEFAULT_VERSION = 'current';

// In main handler:
const requestedVersion = body.parserVersion || DEFAULT_VERSION;
const parser = PARSER_VERSIONS[requestedVersion];
```

**Benefits:**
- Instant switching between parser versions
- No infrastructure changes needed
- Production uses `DEFAULT_VERSION`, training can use any version

---

### Phase 2: Enhanced Training UI

#### New Layout: Side-by-Side View

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │                  │  │ Parser: [Current ▼] vs [Exp ▼]       │ │
│  │    RECEIPT       │  ├──────────────────────────────────────┤ │
│  │    IMAGE         │  │ Store: ICA Kvantum                   │ │
│  │                  │  │ Date: 2025-12-23                     │ │
│  │  (scrollable)    │  │ Total: 2,045.00 kr                   │ │
│  │                  │  ├──────────────────────────────────────┤ │
│  │                  │  │ Items (32):                          │ │
│  │                  │  │ ├─ Gorgonzola 26%... 49.29 kr ✓      │ │
│  │                  │  │ ├─ Kokt Skinka..... 35.90 kr ✓      │ │
│  │                  │  │ └─ ...                               │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### Features to Add

1. **Parser Version Selector**
   ```tsx
   <Select value={parserVersion} onValueChange={setParserVersion}>
     <SelectItem value="current">Current (Production)</SelectItem>
     <SelectItem value="v1">v1 (Legacy)</SelectItem>
     <SelectItem value="experimental">Experimental</SelectItem>
   </Select>
   ```

2. **Comparison Mode**
   - Run same receipt through 2 parsers simultaneously
   - Show results side-by-side with diff highlighting

3. **Persistent Receipt Image**
   - Keep image visible while viewing results
   - Scrollable/zoomable for detailed inspection

---

### Phase 3: Test Case Library

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

### Phase 4: Accuracy Dashboard

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

### Phase 5: Fix ICA Kvantum Parser

#### Approach: Pre-processing Text

Insert spaces before article numbers (8-13 digit sequences):

```typescript
function preprocessICAText(text: string): string {
  // Insert space before 8-13 digit sequences (article numbers)
  return text.replace(/(\D)(\d{8,13})/g, '$1 $2');
}

// Before: "Gorgonz select 26%2022015800000265,001,00 st49,29"
// After:  "Gorgonz select 26% 2022015800000265,001,00 st49,29"
```

This will be implemented in `parseICAReceiptTextExperimental()`.

---

### Phase 6: Production Transition

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

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 1 | Add `parserVersion` parameter to edge function | Low | High |
| 2 | Add parser selector dropdown to ParsingTrainer | Low | High |
| 3 | Fix layout: side-by-side receipt image + results | Medium | High |
| 4 | Add comparison mode (run 2 parsers at once) | Medium | High |
| 5 | Create test case storage table | Low | Medium |
| 6 | Build accuracy scoring dashboard | Medium | Medium |
| 7 | Fix orphan hash problem | Low | Medium |
| 8 | Add retry logic for 429 errors | Low | Medium |
| 9 | Fix ICA Kvantum merged field parsing | High | High |
| 10 | Build manual correction interface | High | Low |

---

## Open Questions

1. **Start order:** Edge function versioning first (UI depends on it) or UI improvements first?
   - **Recommendation:** Edge function first

2. **Test case library scope:** Start with 5-10 receipts or collect more samples first?
   - **Recommendation:** Start with 5-10 covering ICA Kvantum, ICA standard, Willys

3. **Shadow mode:** Log both parser results on real uploads for comparison?
   - **Recommendation:** Yes, useful for measuring real-world accuracy before switching

---

## Progress Tracking

### Completed
- [x] Initial ParsingTrainer component (PR #7)
- [x] Basic upload and parsing functionality
- [x] Debug log viewer

### In Progress
- [ ] Parser versioning in edge function
- [ ] Enhanced UI with side-by-side view

### Not Started
- [ ] Test case library
- [ ] Accuracy dashboard
- [ ] ICA Kvantum fix
- [ ] Production transition mechanism
