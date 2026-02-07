# Feature: 100% Accurate Receipt Parsing

## Description
Enhance the structured receipt parser to achieve near 100% accuracy by fixing specific failure patterns identified in bulk tests. The focus is on prioritizing the correct Total Sum and capturing all product lines, even those with non-standard formats (like multi-buy offers).

## User Story
As a user, I want my receipt total to always match the actual receipt and all items to be listed, so that I can trust the spending data even if minor item details are slightly off.

## Files to Create/Modify
- `scripts/test-parser-local.ts` (New): A local test harness to reproduce failures using raw text from logs.
- `supabase/functions/parse-receipt/index.ts`:
  - Enhance `parseICAKvantumText` to handle "skipped" lines (multi-buy codes, name continuations).
  - Improve `Total` extraction regex (look for "Betalat", "Summa", "Totalt").
  - Add logic to prioritize the extracted Total Sum over the calculated sum.
  - Add a "Rounding/Correction" item if the sum difference is small (< 1 kr).

## Step-by-Step Tasks

### 1. Reproduction & Test Harness
1. [ ] Create `scripts/test-parser-local.ts`.
2. [ ] Copy the *raw text* from the bulk test logs for the failed receipts (ICA Nära Älvsjö 10-31, ICA Kvantum 10-05) into the test script.
3. [ ] Extract the `parseICAKvantumText` logic from `index.ts` into a temporary shared file or duplicate it in the test script to run it locally against the text.

### 2. Enhance Line Parsing Logic
1. [ ] **Multi-buy Support**: Add regex to identify lines like "Donut/Munk 4F30" or "Bas/Koriander 2F35" as valid product lines or name continuations.
2. [ ] **Greedy Name Capture**: Modify the "No Match" block. Instead of skipping, check if `currentProduct` exists. If so, append the line to `currentProduct.name` (unless it matches a known exclude pattern like "Moms", "Kort").
3. [ ] **Orphaned Discounts**: Ensure that if a discount line follows a captured "continuation" line, it correctly applies to the parent product.

### 3. Total Sum Priority
1. [ ] Update `parseICAKvantumText` to search for multiple Total indicators:
   - `/(?:Att betala|Totalt|Summa|Betalat)\s+([\d\s,.]+)/i`
2. [ ] Logic Change:
   - If `extractedTotal` is found, set `receipt.total_amount = extractedTotal`.
   - Calculate `itemSum`.
   - If `Math.abs(extractedTotal - itemSum) < 1.0` (and > 0.01), add a synthetic item `{ name: "Avrundning", price: diff, quantity: 1, category: "other" }` to make them match exactly.

### 4. Error Handling
1. [ ] Wrap the main parser execution in `supabase/functions/parse-receipt/index.ts` with a global `try-catch`.
2. [ ] Ensure it returns a `200 OK` with `{ error: "message" }` instead of crashing (500), to allow the client to handle it gracefully (or trigger AI fallback safely).

## Testing Strategy
- **Local Verification**: Run `npx ts-node scripts/test-parser-local.ts` to verify the fix against the failing text patterns.
- **Criteria**:
  - "Donut/Munk" line must be captured.
  - "Bas/Koriander" line must be captured.
  - Total sum must match the "Betalat" value in the text.
  - No lines in the product section should be "Skipped" unless they are clearly irrelevant headers/footers.

## Validation Commands
```bash
npx tsc --noEmit
npm run lint
npx ts-node scripts/test-parser-local.ts
```

## Acceptance Criteria
- [ ] The "Donuts" receipt parses with 100% item match (no skipped lines causing discount errors).
- [ ] The "Koriander" receipt parses with 100% item match.
- [ ] The Total Sum returned matches the receipt text exactly.
- [ ] Small rounding differences are handled automatically.
