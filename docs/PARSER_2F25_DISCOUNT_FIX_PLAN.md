# Fix Discount Parsing for "2F25" Bundles

## Problem
The `parseICAKvantumText` function correctly identifies lines like "Energidryck 2F25 -33,80" as discount lines, but it treats them as simple cancellations/discounts (subtracting the negative value) rather than recognizing the "multi-buy" offer pattern ("2 items for 25 kr"). This results in incorrect prices when the receipt's arithmetic or OCR is messy (e.g., calculating 8.10 kr instead of 25.00 kr).

## User Review Required
> [!IMPORTANT]
> This change will effectively *override* the discount amount read from the receipt (-33,80) with a calculated discount based on the "2 for 25" text. This assumes the text "2F25" is the source of truth for the price.

## Proposed Changes

### `supabase/functions/parse-receipt`

#### [MODIFY] [index.ts](file:///Users/csandahl/Projects/grocer-gist-2.0/supabase/functions/parse-receipt/index.ts)
- In `parseICAKvantumText`, locate **Pattern 3** (Brand/continuation + discount line).
- Add logic to check the `brandText` (e.g., "Energidryck 2F25") against the multi-buy regex: `/^(.+?)\s*(\d+)\s*(?:för|f|\/)\s*(\d+[,.]?\d*)(?:kr)?$/i`.
- If a multi-buy pattern is found:
    - Parse the `bundleQuantity` and `bundlePrice`.
    - Calculate the expected `finalPrice` (e.g., 25.00 kr).
    - Update `currentProduct.price` to `finalPrice`.
    - Recalculate `currentProduct.discount` as `originalPrice - finalPrice`.
    - Log the override.
- If no multi-buy pattern is found:
    - Fall back to the existing logic (subtracting the parsed discount amount).

## Verification Plan

### Automated Tests
- I will create a new test file `supabase/functions/parse-receipt/fix-discount-test.ts` (or run a script) that invokes `parseICAKvantumText` with a mocked text snippet resembling the problematic receipt.
- Snippet:
```
Beskrivning           Artikelnummer       Pris           Mängd          Summa(SEK)
*Kiwi Guava           7350058335580       13,50           2,00 st          41,90
Energidryck 2F25                                                          -33,80
```
- Assert that the parsed item has:
    - `price`: 25.00
    - `quantity`: 2
    - `discount`: (41.90 - 25.00) = 16.90 (or whatever the original total was)

### Manual Verification
- Since I don't have the original PDF, I rely on the unit test/script.
- I will run the script and verify the output.
