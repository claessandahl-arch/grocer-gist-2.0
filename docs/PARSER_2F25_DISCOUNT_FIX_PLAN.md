# Fix: Discount Parsing for "2F25" Bundles

## Problem Statement

The `parseICAKvantumText` function incorrectly handles multi-buy discount patterns (e.g., "2 for 25 kr") found on ICA receipts.

### Example Receipt Snippet
```
*Kiwi Guava           7350058335580       13,50           2,00 st          41,90
Energidryck 2F25                                                          -33,80
```

### Current (Incorrect) Behavior
- Pattern 3 (lines 796-817) matches "Energidryck 2F25 -33,80"
- Appends "Energidryck 2F25" to product name
- Subtracts discount: `41.90 - 33.80 = 8.10` ← **WRONG!**

### Expected Behavior  
- Detect "2F25" as multi-buy code: "2 for 25 kr"
- Set final price = 25.00 kr (the bundle price)
- Calculate discount = 41.90 - 25.00 = 16.90 kr

---

## Root Cause Analysis

After sequential thinking analysis, identified:

1. **Pattern 3 Current Logic** (lines 800-817):
   ```typescript
   currentProduct.name += ' ' + brandText;  // Appends "Energidryck 2F25"
   currentProduct.discount += discount;     // Adds 33.80
   currentProduct.price -= discount;        // 41.90 - 33.80 = 8.10 ❌
   ```

2. **Existing Working Logic** (lines 1293-1360):
   The codebase **already has** correct multi-buy handling in a different parser section:
   ```typescript
   const offerMatch = beforeNegative.match(/^(.+?)\s*(\d+)\s*(?:för|f|\/)\s*(\d+[,.]?\d*)(?:kr)?$/i);
   if (offerMatch) {
     multiBuyPerItemPrice = bundlePrice / bundleQty;
   }
   // ...later...
   if (multiBuyPerItemPrice !== null) {
     finalPrice = multiBuyPerItemPrice * quantity;
     discount = summa - finalPrice;
   }
   ```

---

## Proposed Changes

### [MODIFY] [index.ts](file:///Users/csandahl/Projects/grocer-gist-2.0/supabase/functions/parse-receipt/index.ts)

Enhance Pattern 3 (lines 796-817) to detect and handle multi-buy offers:

```diff
 // === PATTERN 3: Brand/continuation + discount line ===
 // Lines like "OLW 4F89 -40,80" or "Chokladkaka 2F60 -3,90"
 const brandDiscountMatch = line.match(/^([A-Za-zåäöÅÄÖ...]+?)\s+(-\d+[,.]\d+)$/);

 if (brandDiscountMatch && currentProduct) {
   const brandText = brandDiscountMatch[1].trim();
   const discount = Math.abs(parseFloat(brandDiscountMatch[2].replace(',', '.')));

+  // Check if brandText contains a multi-buy offer pattern
+  // Patterns: "Energidryck 2F25", "Nocco 3för45", "Monster 2/26"
+  const offerPattern = /^(.+?)\s*(\d+)\s*(?:för|f|\/)\s*(\d+[,.]?\d*)(?:kr)?$/i;
+  const multiBuyMatch = brandText.match(offerPattern);
+  
+  if (multiBuyMatch) {
+    const brand = multiBuyMatch[1].trim();
+    const bundleQty = parseInt(multiBuyMatch[2]);
+    const bundlePrice = parseFloat(multiBuyMatch[3].replace(',', '.'));
+    
+    // Prepend brand name if meaningful
+    if (brand && brand.length > 1 && !brand.match(/^\d+$/)) {
+      currentProduct.name += ' ' + brand;
+    }
+    
+    // Set price to bundle price (trust multi-buy code as source of truth)
+    const originalPrice = currentProduct.price;
+    currentProduct.price = bundlePrice;
+    
+    // Calculate actual discount based on multi-buy offer
+    const actualDiscount = parseFloat((originalPrice - bundlePrice).toFixed(2));
+    currentProduct.discount = actualDiscount > 0 ? actualDiscount : undefined;
+    
+    // Update quantity if it doesn't match bundle
+    if (currentProduct.quantity !== bundleQty) {
+      currentProduct.quantity = bundleQty;
+    }
+    
+    debugLog.push(`  Line ${i}: "${linePreview}"`);
+    debugLog.push(`    💰 Multi-buy: ${bundleQty}F${bundlePrice} → price=${bundlePrice} kr`);
+    discountCount++;
+    matchedLines++;
+    continue;
+  }

   // Original behavior for non-multi-buy discount lines
   // ...rest of existing code...
 }
```

---

## Verification Plan

### Automated Tests

1. **Run existing regression tests:**
   ```bash
   npm run test:regression
   ```
   Validates against golden set receipts. Should pass (no regression).

2. **Add targeted unit test** (`scripts/test-2f25-discount.ts`):
   ```typescript
   // Test the specific 2F25 discount parsing scenario
   const testSnippet = `
   *Kiwi Guava  7350058335580  13,50  2,00 st  41,90
   Energidryck 2F25                           -33,80
   `;
   // Expected: price = 25.00, quantity = 2, discount = 16.90
   ```
   Run: `npx tsx scripts/test-2f25-discount.ts`

### Manual Verification
1. Upload a real receipt with "2F25" multi-buy offer
2. Verify price shows **25.00 kr** (not 8.10 kr)

---

## Alternative Approaches Considered

| Approach | Description | Why Selected/Rejected |
|----------|-------------|----------------------|
| Pre-processing | Normalize patterns before parsing | Adds complexity |
| Post-processing | Fix prices after parsing | Dual sources of truth |
| **Inline detection** | Check within Pattern 3 | ✅ Reuses proven logic |

---

## Risk Assessment

> [!WARNING]
> Receipt math (41.90 - 33.80 = 8.10) is IGNORED when multi-buy code detected. Trusts multi-buy code as source of truth.

**Edge cases to monitor:**
- Multi-buy codes resembling article numbers
- Different formats: "2för25", "2/25", "2f25"
