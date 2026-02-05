# Linting Fixes for `supabase/functions/parse-receipt/index.ts`

## Overview
The file `supabase/functions/parse-receipt/index.ts` currently has 44 linting problems (38 errors, 6 warnings). The majority of these are explicit `any` type usage, which violates strict typing rules.

## Identified Issues

### 1. Unexpected `any` Types
The following lines use `any` where a specific type should be defined:
- **Line 120-121**: `ItemDiff` interface properties.
- **Line 162**: `parseWillysReceiptText` return type (`_debug`).
- **Line 427**: `parseICAKvantumText` return type (`_debug`).
- **Line 584, 602, 605, 616, 670, 792**: Type casting `currentProduct` to `any` to access temporary properties like `_expectsDiscount` or `_isCoupon`.
- **Line 666**: Casting category to `any`.
- **Line 938**: `parseICAReceiptText` return type (`_debug`).
- **Line 1656**: `structuredResult` variable definition (`_debug`).
- **Line 2368**: Reduce function callback parameter.

### 2. Logic & Style Issues
- **Line 197**: `let line` is never reassigned; should be `const`.
- **Line 627**: Unnecessary escape character `\.` in regex.

## Implementation Plan

### Step 1: Define New Interfaces
Create these interfaces at the top of the file to replace `any` usage.

```typescript
// Interface for the _debug object returned by parsers
interface ParserDebugInfo {
  method?: string;
  items_found?: number;
  lines_processed?: number;
  multiline_count?: number;
  discount_count?: number;
  pant_count?: number;
  parserVersion?: string;
  pdf_text_length?: number;
  debugLog?: string[];
  [key: string]: unknown; // Allow flexibility for other debug props
}

// Interface for internal parsing state, extending the base item
interface WorkingParsedItem extends ParsedItem {
  _expectsDiscount?: boolean;
  _isCoupon?: boolean;
}
```

### Step 2: Update Function Signatures
Update the return types of the parser functions to use `ParserDebugInfo`.

**Current:**
```typescript
function parseWillysReceiptText(...): { ... _debug?: any } | null
```

**New:**
```typescript
function parseWillysReceiptText(...): { ... _debug?: ParserDebugInfo } | null
```

Apply this change to:
- `parseWillysReceiptText` (Line 162)
- `parseICAKvantumText` (Line 427)
- `parseICAReceiptText` (Line 938)
- `structuredResult` variable (Line 1656)

### Step 3: Update `ItemDiff` Interface
Replace `any` in the `differences` array.

**Current:**
```typescript
differences: {
  field: 'name' | 'price' | 'quantity' | 'category' | 'discount';
  structured: any;
  ai: any;
}[];
```

**New:**
```typescript
differences: {
  field: 'name' | 'price' | 'quantity' | 'category' | 'discount';
  structured: string | number | undefined;
  ai: string | number | undefined;
}[];
```

### Step 4: Fix Internal Logic Casts
Replace `(currentProduct as any)` with `(currentProduct as WorkingParsedItem)`.

**Locations:**
- Line 584: `(currentProduct as WorkingParsedItem)._expectsDiscount = true;`
- Line 602: `if ((currentProduct as WorkingParsedItem)._isCoupon)`
- Line 605: `delete (currentProduct as WorkingParsedItem)._isCoupon;`
- Line 616: `delete (currentProduct as WorkingParsedItem)._expectsDiscount;`
- Line 670: `(currentProduct as WorkingParsedItem)._isCoupon = true;`
- Line 792: `if (!(currentProduct as WorkingParsedItem)?._expectsDiscount)`

### Step 5: Fix Miscellaneous Issues
- **Line 197**: Change `let line` to `const line`.
- **Line 627**: Remove backslash in `[\.]`.
- **Line 666**: Remove `as any` from category assignment.
- **Line 2368**: Change `(sum: number, item: any)` to `(sum: number, item: ParsedItem)`.
