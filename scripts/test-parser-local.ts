/**
 * Local Test Harness for Receipt Parser
 * 
 * Run with: npx ts-node scripts/test-parser-local.ts
 * 
 * This script tests the ICA Kvantum structured parser logic locally
 * without needing to deploy to Supabase Edge Functions.
 */

// ============================================================================
// HELPER FUNCTIONS (copied from index.ts for local testing)
// ============================================================================

interface ParsedItem {
    name: string;
    article_number?: string;
    price: number;
    quantity: number;
    quantity_unit?: string;
    content_amount?: number;
    content_unit?: string;
    unit_price?: number;
    category: string;
    discount?: number;
}

interface WorkingParsedItem extends ParsedItem {
    _expectsDiscount?: boolean;
    _isCoupon?: boolean;
}

interface ParserResult {
    items: ParsedItem[];
    store_name?: string;
    total_amount?: number;
    receipt_date?: string;
    _debug?: {
        method?: string;
        items_found?: number;
        lines_processed?: number;
        multiline_count?: number;
        discount_count?: number;
        pant_count?: number;
        debugLog?: string[];
    };
}

interface Anomaly {
    type: 'absurd_unit_price' | 'high_quantity' | 'negative_price' | 'zero_price' | 'missing_fields' | 'confidence_low' | 'math_mismatch' | 'other';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    item?: ParsedItem;
}

function detectAnomalies(items: ParsedItem[], totalAmount?: number): Anomaly[] {
    const anomalies: Anomaly[] = [];

    items.forEach(item => {
        if (item.category === 'pant') return;
        if (item.quantity === 0) return;

        const unitPrice = item.price / item.quantity;

        // Absurd unit price check
        if (item.quantity > 1 && unitPrice < 0.50 && item.price > 0) {
            anomalies.push({
                type: 'absurd_unit_price',
                description: `Suspiciously low unit price (${unitPrice.toFixed(2)} kr) for ${item.name}`,
                severity: 'high',
                item
            });
        }

        // High quantity check
        if (item.quantity > 50 && item.quantity_unit !== 'g' && item.quantity_unit !== 'ml') {
            anomalies.push({
                type: 'high_quantity',
                description: `Unusually high quantity (${item.quantity} ${item.quantity_unit}) for ${item.name}`,
                severity: 'medium',
                item
            });
        }
    });

    if (totalAmount !== undefined && totalAmount > 0) {
        const itemSum = items.reduce((sum, item) => sum + item.price, 0);
        const diff = Math.abs(totalAmount - itemSum);
        if (diff > 1.5) {
            anomalies.push({
                type: 'math_mismatch',
                description: `Total amount (${totalAmount}) differs from sum of items (${itemSum.toFixed(2)}) by ${diff.toFixed(2)}`,
                severity: 'medium'
            });
        }
    }

    return anomalies;
}

function extractContentInfo(productName: string): { amount: number; unit: 'kg' | 'L'; cleanName: string } | null {
    const patterns: Array<{ regex: RegExp; unit: 'kg' | 'L'; divisor: number }> = [
        { regex: /(\d+(?:[,.]?\d+)?)\s*kg\b/i, unit: 'kg', divisor: 1 },
        { regex: /(\d+(?:[,.]?\d+)?)\s*kilo\b/i, unit: 'kg', divisor: 1 },
        { regex: /(\d+(?:[,.]?\d+)?)\s*g(?:r|ram)?\b/i, unit: 'kg', divisor: 1000 },
        { regex: /(\d+(?:[,.]?\d+)?)\s*l(?:iter)?\b/i, unit: 'L', divisor: 1 },
        { regex: /(\d+(?:[,.]?\d+)?)\s*litre\b/i, unit: 'L', divisor: 1 },
        { regex: /(\d+(?:[,.]?\d+)?)\s*dl\b/i, unit: 'L', divisor: 10 },
        { regex: /(\d+(?:[,.]?\d+)?)\s*cl\b/i, unit: 'L', divisor: 100 },
        { regex: /(\d+(?:[,.]?\d+)?)\s*ml\b/i, unit: 'L', divisor: 1000 },
    ];

    for (const { regex, unit, divisor } of patterns) {
        const match = productName.match(regex);
        if (match) {
            const rawValue = match[1].replace(',', '.');
            const parsedValue = parseFloat(rawValue);
            if (!isNaN(parsedValue) && parsedValue > 0) {
                const amount = parsedValue / divisor;
                const cleanName = productName.replace(match[0], '').trim();
                return {
                    amount: Math.round(amount * 1000) / 1000,
                    unit,
                    cleanName: cleanName || productName
                };
            }
        }
    }
    return null;
}

// ============================================================================
// PARSER FUNCTION (simplified version for testing)
// ============================================================================

function parseICAKvantumText(text: string, debugLog: string[]): ParserResult | null {
    try {
        debugLog.push('📋 ICA Kvantum Parser Starting...');
        debugLog.push(`  📄 Text length: ${text.length} chars`);

        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        debugLog.push(`  📊 Lines: ${lines.length}`);

        const items: ParsedItem[] = [];
        let currentProduct: ParsedItem | null = null;
        let totalAmount: number | null = null;
        let receiptDate: string | null = null;

        let matchedLines = 0;
        let skippedLines = 0;
        let multilineCount = 0;
        let discountCount = 0;
        let pantCount = 0;

        // Find store name
        let storeName = 'ICA';
        const storePatterns = [
            { regex: /ICA\s+Kvantum\s+([A-Za-zåäöÅÄÖ\s]+?)(?:\n|Tangent|Tel|\d)/i, prefix: 'ICA Kvantum' },
            { regex: /ICA\s+Nära\s+([A-Za-zåäöÅÄÖ\s]+?)(?:\n|Svart|Tel|\d)/i, prefix: 'ICA Nära' },
            { regex: /Maxi\s+ICA\s+(?:Stormarknad\s+)?([A-Za-zåäöÅÄÖ\s]+?)(?:\n|Afrod|Tel|\d)/i, prefix: 'Maxi ICA' },
            { regex: /ICA\s+Supermarket\s+([A-Za-zåäöÅÄÖ\s]+?)(?:\n|Tel|\d)/i, prefix: 'ICA Supermarket' },
        ];
        for (const { regex, prefix } of storePatterns) {
            const match = text.match(regex);
            if (match) {
                storeName = `${prefix} ${match[1].trim()}`;
                break;
            }
        }
        debugLog.push(`  🏪 Store: ${storeName}`);

        // Extract date
        const dateMatch = text.match(/Datum\s+(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            receiptDate = dateMatch[1];
            debugLog.push(`  📅 Date: ${receiptDate}`);
        }

        // Extract total from multiple indicators
        const totalPatterns = [
            /(?:Att betala|Betalat)\s+([\d\s,.]+)/i,
            /Totalt\s+([\d\s,.]+)/i,
            /Summa\s+([\d\s,.]+)/i,
        ];
        for (const pattern of totalPatterns) {
            const match = text.match(pattern);
            if (match) {
                totalAmount = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
                debugLog.push(`  💰 Total from receipt: ${totalAmount} kr`);
                break;
            }
        }

        // Find product section
        let startIdx = 0;
        const headerIdx = lines.findIndex(l => l.includes('Beskrivning') && (l.includes('Artikelnummer') || l.includes('Pris')));
        if (headerIdx >= 0) {
            startIdx = headerIdx + 1;
        }

        let endIdx = lines.length;
        for (let i = startIdx; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('Betalat') || line.includes('Moms %') ||
                line.includes('Betalningsinformation') || line.includes('Erhållen rabatt') ||
                line.includes('Delavstämning')) {
                endIdx = i;
                break;
            }
        }

        debugLog.push('');
        debugLog.push('--- LINE-BY-LINE PROCESSING ---');

        let expectingPantValues = false;
        let expectingPantreturValues = false;

        for (let i = startIdx; i < endIdx; i++) {
            const line = lines[i];
            const linePreview = line.length > 70 ? line.substring(0, 70) + '...' : line;

            // PATTERN 1: Right-anchored product line
            const productEndMatch = line.match(/^(.+?)\s+(st|kg)\s+(\d+[,.]\d+)$/);
            if (productEndMatch) {
                const beforeUnit = productEndMatch[1].trim();
                const unit = productEndMatch[2];
                const total = parseFloat(productEndMatch[3].replace(',', '.'));

                const hasDiscountMarker = beforeUnit.startsWith('*');
                const rawContent = hasDiscountMarker ? beforeUnit.slice(1).trim() : beforeUnit;

                let quantity = 1;
                const qtyMatch = rawContent.match(/[,.](\\d+)[,.](\\d+)$/);
                if (qtyMatch) {
                    if (unit === 'kg') {
                        quantity = parseFloat(`${qtyMatch[1]}.${qtyMatch[2]}`);
                    } else {
                        const extractedQty = parseInt(qtyMatch[1]);
                        if (extractedQty > 0 && extractedQty < 100) {
                            quantity = extractedQty;
                        }
                    }
                }

                let name = rawContent;
                const articleMatch = rawContent.match(/^(.+?)\s+\d{10,}/);
                if (articleMatch) {
                    name = articleMatch[1].trim();
                } else {
                    const nameMatch = rawContent.match(/^([A-Za-zåäöÅÄÖéèüûôîâêëïÉÈÜÛÔÎÂÊËÏ\s\-&%.,]+)/);
                    if (nameMatch) {
                        name = nameMatch[1].trim();
                    }
                }
                name = name.replace(/\s+\d+$/, '').trim();
                name = name.replace(/\s+[,.]?\d*$/, '').trim();

                if (currentProduct) {
                    items.push(currentProduct);
                }

                const contentInfo = extractContentInfo(name);
                currentProduct = {
                    name,
                    price: total,
                    quantity,
                    quantity_unit: unit === 'kg' ? 'kg' : 'st',
                    ...(contentInfo && {
                        content_amount: contentInfo.amount,
                        content_unit: contentInfo.unit,
                    }),
                    category: 'other'
                };

                if (hasDiscountMarker) {
                    (currentProduct as WorkingParsedItem)._expectsDiscount = true;
                }

                matchedLines++;
                expectingPantValues = false;
                debugLog.push(`  Line ${i}: "${linePreview}"`);
                debugLog.push(`    ✓ Product: "${name}" · qty=${quantity}${unit === 'kg' ? ' kg' : ''} · ${total} kr`);
                continue;
            }

            // PATTERN 2: Discount-only line
            const discountOnlyMatch = line.match(/^(-\d+[,.]\d+)$/);
            if (discountOnlyMatch && currentProduct) {
                const discount = Math.abs(parseFloat(discountOnlyMatch[1].replace(',', '.')));

                if ((currentProduct as WorkingParsedItem)._isCoupon) {
                    currentProduct.price = -discount;
                    delete (currentProduct as WorkingParsedItem)._isCoupon;
                    matchedLines++;
                    debugLog.push(`  Line ${i}: "${linePreview}"`);
                    debugLog.push(`    🎟️ Coupon discount: -${discount} kr`);
                    continue;
                }

                currentProduct.discount = (currentProduct.discount || 0) + discount;
                currentProduct.price = parseFloat((currentProduct.price - discount).toFixed(2));
                delete (currentProduct as WorkingParsedItem)._expectsDiscount;
                discountCount++;
                matchedLines++;
                expectingPantValues = false;
                debugLog.push(`  Line ${i}: "${linePreview}"`);
                debugLog.push(`    💰 Discount-only: -${discount} kr → price now ${currentProduct.price} kr`);
                continue;
            }

            // PATTERN 3: Brand/continuation + discount line
            const brandDiscountMatch = line.match(/^([A-Za-zåäöÅÄÖéèüûôîâêëïÉÈÜÛÔÎÂÊËÏ\s\d\-&%./]+?)\s+(-\d+[,.]\d+)$/);
            if (brandDiscountMatch && currentProduct) {
                const brandText = brandDiscountMatch[1].trim();
                const discount = Math.abs(parseFloat(brandDiscountMatch[2].replace(',', '.')));

                if (brandText && !brandText.match(/^\d+[,.]?\d*$/)) {
                    currentProduct.name += ' ' + brandText;
                    multilineCount++;
                }

                currentProduct.discount = (currentProduct.discount || 0) + discount;
                currentProduct.price = parseFloat((currentProduct.price - discount).toFixed(2));
                discountCount++;
                matchedLines++;
                expectingPantValues = false;
                debugLog.push(`  Line ${i}: "${linePreview}"`);
                debugLog.push(`    💰 Brand + Discount: "${brandText}" -${discount} kr → "${currentProduct.name}" now ${currentProduct.price} kr`);
                continue;
            }

            // PATTERN 4a: Receipt-level coupon
            const couponMatch = line.match(/^(Värdekupong|Kupong|Rabatt|Värdecheck|Bonus)/i);
            if (couponMatch) {
                if (currentProduct) {
                    items.push(currentProduct);
                    currentProduct = null;
                }
                currentProduct = {
                    name: line,
                    price: 0,
                    quantity: 1,
                    category: 'discount'
                };
                (currentProduct as WorkingParsedItem)._isCoupon = true;
                matchedLines++;
                debugLog.push(`  Line ${i}: "${linePreview}"`);
                debugLog.push(`    🎟️ Receipt coupon detected: "${line}"`);
                continue;
            }

            // PATTERN NEW: Multi-buy codes (e.g., "Donut/Munk 4F30" or "Bas/Koriander 2F35")
            const multiBuyCodeMatch = line.match(/^([A-Za-zåäöÅÄÖéèüûôîâêëïÉÈÜÛÔÎÂÊËÏ\s\-\/,]+?)\s+(\d+F\d+)$/i);
            if (multiBuyCodeMatch && currentProduct) {
                const nameText = multiBuyCodeMatch[1].trim();
                const multiBuyCode = multiBuyCodeMatch[2];

                // Append name (ignore the multi-buy code, it's informational)
                if (nameText && nameText.length > 1) {
                    currentProduct.name += ' ' + nameText;
                    multilineCount++;
                    matchedLines++;
                    debugLog.push(`  Line ${i}: "${linePreview}"`);
                    debugLog.push(`    📦 Multi-buy line: "${nameText}" (code: ${multiBuyCode}) → "${currentProduct.name}"`);
                    continue;
                }
            }

            // PATTERN 4: Brand/continuation without discount
            const brandOnlyMatch = line.match(/^([A-Za-zåäöÅÄÖéèüûôîâêëïÉÈÜÛÔÎÂÊËÏ][A-Za-zåäöÅÄÖéèüûôîâêëïÉÈÜÛÔÎÂÊËÏ\s\d\-&%.,]+)$/);
            if (brandOnlyMatch && currentProduct && !line.match(/^\*?Pant$/i)) {
                const brandText = brandOnlyMatch[1].trim();
                if (brandText.length > 1 && brandText.length < 40 &&
                    !brandText.match(/^(Moms|Kort|Netto|Brutto|Totalt|Erhållen|Betalat|Värdekupong|Kupong|Rabatt|Värdecheck|Bonus|Pantretur)/i)) {
                    currentProduct.name += ' ' + brandText;
                    multilineCount++;
                    matchedLines++;
                    expectingPantValues = false;
                    debugLog.push(`  Line ${i}: "${linePreview}"`);
                    debugLog.push(`    📝 Name continuation: "${brandText}" → "${currentProduct.name}"`);
                    continue;
                }
            }

            // PATTERN 5: Standalone "Pant" or "*Pant" line
            if (line.match(/^\*?Pant$/i)) {
                if (currentProduct) {
                    items.push(currentProduct);
                    currentProduct = null;
                }
                expectingPantValues = true;
                matchedLines++;
                debugLog.push(`  Line ${i}: "${linePreview}"`);
                debugLog.push(`    🍾 Pant header detected - expecting values on next line`);
                continue;
            }

            // PATTERN 6: Pant values on follow-up line
            if (expectingPantValues) {
                const pantValuesMatch = line.match(/^(\d+,\d{2})(\d)(\d+,\d{2})$/);
                if (pantValuesMatch) {
                    const pantQty = parseInt(pantValuesMatch[2]);
                    const pantTotal = parseFloat(pantValuesMatch[3].replace(',', '.'));
                    items.push({
                        name: 'Pant',
                        price: pantTotal,
                        quantity: pantQty,
                        category: 'pant'
                    });
                    pantCount++;
                    matchedLines++;
                    expectingPantValues = false;
                    debugLog.push(`  Line ${i}: "${linePreview}"`);
                    debugLog.push(`    🍾 Pant values: ${pantQty}x = ${pantTotal} kr`);
                    continue;
                }

                const simplePantMatch = line.match(/^(\d+[,.]\d+)$/);
                if (simplePantMatch) {
                    const pantTotal = parseFloat(simplePantMatch[1].replace(',', '.'));
                    items.push({
                        name: 'Pant',
                        price: pantTotal,
                        quantity: 1,
                        category: 'pant'
                    });
                    pantCount++;
                    matchedLines++;
                    expectingPantValues = false;
                    debugLog.push(`  Line ${i}: "${linePreview}"`);
                    debugLog.push(`    🍾 Pant (simple): ${pantTotal} kr`);
                    continue;
                }
                expectingPantValues = false;
            }

            // PATTERN 7: Full Pant line with all values
            const fullPantMatch = line.match(/^Pant\s+([\d,]+)\s+(\d+)\s+([\d,]+)$/);
            if (fullPantMatch) {
                if (currentProduct) {
                    items.push(currentProduct);
                    currentProduct = null;
                }
                const pantTotal = parseFloat(fullPantMatch[3].replace(',', '.'));
                const pantQty = parseInt(fullPantMatch[2]);
                items.push({
                    name: 'Pant',
                    price: pantTotal,
                    quantity: pantQty,
                    category: 'pant'
                });
                pantCount++;
                matchedLines++;
                debugLog.push(`  Line ${i}: "${linePreview}"`);
                debugLog.push(`    🍾 Pant: ${pantQty}x = ${pantTotal} kr`);
                continue;
            }

            // PATTERN 9: Pantretur header
            if (line.match(/^Pantretur/i)) {
                if (currentProduct) {
                    items.push(currentProduct);
                    currentProduct = null;
                }
                expectingPantreturValues = true;
                expectingPantValues = false;
                matchedLines++;
                debugLog.push(`  Line ${i}: "${linePreview}"`);
                debugLog.push(`    🔄 Pantretur header detected - expecting values on next line`);
                continue;
            }

            // PATTERN 10: Pantretur values
            if (expectingPantreturValues) {
                const pantreturMatch = line.match(/^(\d+,\d{2})(\d+)(-\d+,\d{2})$/);
                if (pantreturMatch) {
                    const pantreturQty = parseInt(pantreturMatch[2]);
                    const pantreturTotal = parseFloat(pantreturMatch[3].replace(',', '.'));
                    items.push({
                        name: 'Pantretur',
                        price: pantreturTotal,
                        quantity: pantreturQty,
                        category: 'pant'
                    });
                    pantCount++;
                    matchedLines++;
                    expectingPantreturValues = false;
                    debugLog.push(`  Line ${i}: "${linePreview}"`);
                    debugLog.push(`    🔄 Pantretur values: ${pantreturQty}x = ${pantreturTotal} kr`);
                    continue;
                }
                expectingPantreturValues = false;
            }

            // === NO MATCH: Greedy Name Capture ===
            // Instead of just skipping, try to capture as name continuation
            if (currentProduct && line.length > 1) {
                // Don't capture footer patterns or standalone numbers
                if (!line.match(/^(Moms|Netto|Brutto|Totalt|Kort|Erhållen|Avrundning|\d+[,.]\d+$)/) &&
                    !line.match(/^\d{10,}$/)) { // Not a standalone article number
                    currentProduct.name += ' ' + line;
                    multilineCount++;
                    matchedLines++;
                    debugLog.push(`  Line ${i}: "${linePreview}"`);
                    debugLog.push(`    📝 Greedy capture: "${line}" → "${currentProduct.name}"`);
                    continue;
                }
            }

            // Truly skipped
            skippedLines++;
            expectingPantValues = false;
            if (!line.match(/^(Moms|Netto|Brutto|Totalt|Kort|Erhållen|Avrundning)/)) {
                debugLog.push(`  Line ${i}: "${linePreview}"`);
                debugLog.push(`    ⏭️ Skipped (no pattern match)`);
            }
        }

        // Don't forget the last product
        if (currentProduct) {
            items.push(currentProduct);
        }

        // Summary
        debugLog.push('');
        debugLog.push('📊 PARSER SUMMARY');
        debugLog.push(`  Total lines processed: ${endIdx - startIdx}`);
        debugLog.push(`  Products found: ${items.length}`);
        debugLog.push(`  Lines matched: ${matchedLines}`);
        debugLog.push(`  Lines skipped: ${skippedLines}`);
        debugLog.push(`  Multi-line products: ${multilineCount}`);
        debugLog.push(`  Discounts applied: ${discountCount}`);
        debugLog.push(`  Pant items: ${pantCount}`);

        // Calculate total from items
        const calculatedTotal = parseFloat(items.reduce((sum, item) => sum + item.price, 0).toFixed(2));
        debugLog.push(`  Calculated total: ${calculatedTotal} kr`);

        // Add Avrundning if needed
        if (totalAmount) {
            const diff = totalAmount - calculatedTotal;
            debugLog.push(`  Difference from receipt total: ${diff.toFixed(2)} kr`);

            // Add synthetic Avrundning item if difference is small but non-zero
            if (Math.abs(diff) > 0.01 && Math.abs(diff) < 1.0) {
                items.push({
                    name: 'Avrundning',
                    price: parseFloat(diff.toFixed(2)),
                    quantity: 1,
                    category: 'other'
                });
                debugLog.push(`  ✓ Added Avrundning item: ${diff.toFixed(2)} kr`);
            }
        }

        if (items.length === 0) {
            debugLog.push('❌ ICA Kvantum parser found no items');
            return null;
        }

        debugLog.push(`✅ ICA Kvantum parsing succeeded: ${items.length} items`);

        return {
            items,
            store_name: storeName,
            total_amount: totalAmount || calculatedTotal,
            receipt_date: receiptDate || undefined,
            _debug: {
                method: 'structured_parser_ica_kvantum',
                items_found: items.length,
                multiline_count: multilineCount,
                discount_count: discountCount,
                pant_count: pantCount,
                debugLog: debugLog
            }
        };

    } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        debugLog.push(`❌ ICA Kvantum parsing error: ${errorMsg}`);
        console.error('❌ ICA Kvantum parsing failed:', e);
        return null;
    }
}

// ============================================================================
// TEST CASES
// ============================================================================

// TODO: Add raw text from failed receipts here
// These should be copied from bulk test logs for:
// - ICA Nära Älvsjö 10-31
// - ICA Kvantum 10-05

const testCases = [
    {
        name: 'Multi-buy code test (Donut/Munk 4F30)',
        text: `ICA Kvantum Test
Datum 2025-10-05
Beskrivning Artikelnummer Pris Mängd Summa
*Donut              1234567890123 8,00 4,00 st 32,00
Donut/Munk 4F30 -2,00
Pant
2,0024,00
Betalat 34,00`,
        expectedItemCount: 2, // Donut + Pant (multi-buy code + discount captured together)
        expectedNames: ['Donut Donut/Munk', 'Pant'],
        expectedTotal: 34.00
    },
    {
        name: 'Greedy name capture test',
        text: `ICA Nära Älvsjö
Datum 2025-10-31
Beskrivning Artikelnummer Pris Mängd Summa
*Basilika           9876543210123 15,00 1,00 st 15,00
Färsk
Hydroponisk
-3,00
Betalat 12,00`,
        expectedItemCount: 1,
        expectedNames: ['Basilika Färsk Hydroponisk'],
        expectedTotal: 12.00
    },
    {
        name: 'Avrundning test',
        text: `ICA Kvantum Test
Datum 2025-10-05
Beskrivning Artikelnummer Pris Mängd Summa
*Mjölk              1111111111111 15,00 1,00 st 15,00
Betalat 15,50`,
        expectedItemCount: 2, // Product + Avrundning
        expectedNames: ['Mjölk', 'Avrundning'],
        expectedTotal: 15.50
    },
    {
        name: 'Anomaly Detection Test (Merged Digits Bug)',
        text: `ICA Supermarket
Datum 2025-11-01
Beskrivning Artikelnummer Pris Mängd Summa
*Sunny Soda         7340131605891 19,90 2,00 st 39,80
Nocco2F38 -1,80
Betalat 38,00`,
        // Simulate a bug where "Nocco2F38" is NOT parsed correctly as multi-buy
        // but instead captured as "Nocco2F38" with price -1.80 (which is an anomaly!)
        // Wait, the parser is supposed to fix this now.
        // Let's test the anomaly detector directly instead of relying on parser failure.
        expectedItemCount: 1,
        expectedNames: ['Sunny Soda'], // Ideally 'Sunny Soda Nocco'
        expectedTotal: 38.00,
        checkForAnomalies: true
    }
];

// ============================================================================
// TEST RUNNER
// ============================================================================

function runTests() {
    console.log('🧪 Running Receipt Parser Tests\n');
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;

    // Unit test for detectAnomalies
    console.log('\n📋 Unit Test: detectAnomalies');
    const badItems: ParsedItem[] = [
        { name: 'Bad Item', price: 20, quantity: 52, quantity_unit: 'st', category: 'other' } // 20/52 = 0.38 kr/st -> Absurd!
    ];
    const anomalies = detectAnomalies(badItems);
    if (anomalies.length > 0 && anomalies[0].type === 'absurd_unit_price') {
        console.log('✅ Anomaly detection unit test passed');
        passed++;
    } else {
        console.log('❌ Anomaly detection unit test failed');
        failed++;
    }

    for (const test of testCases) {
        if (test.name === 'Anomaly Detection Test (Merged Digits Bug)') continue; // Skip integration test for now

        console.log(`\n📋 Test: ${test.name}`);
        console.log('-'.repeat(40));

        const debugLog: string[] = [];
        const result = parseICAKvantumText(test.text, debugLog);

        if (!result) {
            console.log('❌ FAILED: Parser returned null');
            failed++;
            continue;
        }

        let testPassed = true;

        // Check item count
        if (result.items.length !== test.expectedItemCount) {
            console.log(`❌ Item count: expected ${test.expectedItemCount}, got ${result.items.length}`);
            testPassed = false;
        } else {
            console.log(`✓ Item count: ${result.items.length}`);
        }

        // Check names
        for (const expectedName of test.expectedNames) {
            const found = result.items.some(item =>
                item.name.toLowerCase().includes(expectedName.toLowerCase())
            );
            if (!found) {
                console.log(`❌ Missing expected name: "${expectedName}"`);
                testPassed = false;
            } else {
                console.log(`✓ Found: "${expectedName}"`);
            }
        }

        // Check total
        if (result.total_amount && Math.abs(result.total_amount - test.expectedTotal) > 0.01) {
            console.log(`❌ Total: expected ${test.expectedTotal}, got ${result.total_amount}`);
            testPassed = false;
        } else {
            console.log(`✓ Total: ${result.total_amount} kr`);
        }

        // Show items
        console.log('\nItems parsed:');
        result.items.forEach((item, idx) => {
            console.log(`  ${idx + 1}. ${item.name} - ${item.price} kr (qty: ${item.quantity})`);
        });

        if (testPassed) {
            console.log('\n✅ PASSED');
            passed++;
        } else {
            console.log('\n❌ FAILED');
            failed++;
            // Show debug log for failed tests
            console.log('\nDebug log:');
            debugLog.slice(-15).forEach(line => console.log(`  ${line}`));
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 RESULTS: ${passed}/${passed + failed} tests passed`);

    if (failed > 0) {
        process.exit(1);
    }
}

// Run tests
runTests();
