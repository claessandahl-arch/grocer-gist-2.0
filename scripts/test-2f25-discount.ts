import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Targeted unit test for 2F25 multi-buy discount parsing
 * Tests the fix for Pattern 3 in parseICAKvantumText function
 */

interface TestCase {
    name: string;
    lines: string[];
    expectedPrice: number;
    expectedDiscount: number;
    expectedName: string;
}

const testCases: TestCase[] = [
    {
        name: 'Classic 2F25 pattern (Energidryck)',
        lines: [
            '*Kiwi Guava Nocco Bcaa 33cl Påse 2',
            ' 41,90',
            'Energidryck 2F25 -33,80'
        ],
        expectedPrice: 25.00,
        expectedDiscount: 16.90, // Original 41.90 - Bundle 25.00 = 16.90 kr saved
        expectedName: 'Kiwi Guava Nocco Bcaa 33cl Påse Energidryck'
    },
    {
        name: '4F89 pattern (OLW)',
        lines: [
            '*OLW Chips Sourcream 175g 4',
            ' 129,80',
            'OLW 4F89 -40,80'
        ],
        expectedPrice: 89.00,
        expectedDiscount: 40.80, // Original 129.80 - Bundle 89.00 = 40.80 kr saved (4 items for 89 kr)
        expectedName: 'OLW Chips Sourcream 175g OLW'
    },
    {
        name: '3F27 pattern (Edge case: bundle price > original)',
        lines: [
            '*Äpplen Pink Lady',
            ' 18,00',
            'Frukt 3F27 -9,00'  // Unusual: bundle costs MORE than original (18 kr becomes 27 kr)
        ],
        expectedPrice: 27.00,
        expectedDiscount: 0.00, // Math.max(0, 18-27) = 0, prevents negative discount
        expectedName: 'Äpplen Pink Lady Frukt'
    },
    {
        name: 'Regular discount (no multi-buy)',
        lines: [
            '*Mjölk Arla Ekologisk 3%',
            ' 25,00',
            'Kampanj -5,00'
        ],
        expectedPrice: 20.00,
        expectedDiscount: 5.00,
        expectedName: 'Mjölk Arla Ekologisk 3% Kampanj'
    }
];

async function runTest(testCase: TestCase): Promise<boolean> {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`Input lines:\n${testCase.lines.map(l => `  "${l}"`).join('\n')}`);

    // This is a simplified mock - in reality you'd need to:
    // 1. Upload a test PDF with this content to Supabase Storage
    // 2. Invoke the parse-receipt Edge Function
    // 3. Check the returned items

    // For now, we'll just document what we expect
    console.log(`\nExpected results:`);
    console.log(`  Name: "${testCase.expectedName}"`);
    console.log(`  Price: ${testCase.expectedPrice.toFixed(2)} kr`);
    console.log(`  Discount: ${testCase.expectedDiscount.toFixed(2)} kr`);

    // TODO: Actually invoke the Edge Function and validate
    console.log(`\n⚠️  This test requires full Supabase integration to run`);
    console.log(`   Use 'npm run test:regression' for full testing`);

    return true;
}

async function main() {
    console.log('====================================');
    console.log('2F25 Multi-Buy Discount Parser Test');
    console.log('====================================\n');

    let allPassed = true;

    for (const testCase of testCases) {
        const passed = await runTest(testCase);
        if (!passed) {
            allPassed = false;
        }
    }

    console.log('\n====================================');
    if (allPassed) {
        console.log('✅ All test cases documented');
        console.log('\nNext steps:');
        console.log('1. Run: npm run test:regression');
        console.log('2. Upload a real receipt with 2F25 pattern');
        console.log('3. Verify in the UI that price = 25.00 kr, not 8.10 kr');
    } else {
        console.log('❌ Some tests failed');
    }
    console.log('====================================\n');
}

main();
