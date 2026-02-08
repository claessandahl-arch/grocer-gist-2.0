import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Workaround for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GoldenReceipt {
  id: string;
  store_type: string;
  pdf_file: string;
  expected_file?: string;
  items_count: number;
  total_amount: number;
  notes?: string;
}

interface TestResult {
  receipt_id: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    items_matched: number;
    items_expected: number;
    price_accuracy: number;
  };
}

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

async function runRegressionTests(): Promise<TestResult[]> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Prefer service role for admin tasks

  if (!supabaseUrl || !supabaseKey) {
    console.error(`${colors.red}Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/ANON_KEY must be set in .env${colors.reset}`);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Load golden set index
  const indexPath = path.join(__dirname, '../test-receipts/golden-set/golden-set-index.json');

  if (!fs.existsSync(indexPath)) {
    console.error(`${colors.red}Error: Golden set index not found at ${indexPath}${colors.reset}`);
    process.exit(1);
  }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const receipts = index.receipts as GoldenReceipt[];

  if (receipts.length === 0) {
    console.warn(`${colors.yellow}Warning: No receipts defined in golden set index.${colors.reset}`);
    return [];
  }

  const results: TestResult[] = [];

  console.log(`${colors.cyan}🧪 Running Parser Regression Tests (${receipts.length} receipts)${colors.reset}\n`);

  for (const receipt of receipts) {
    console.log(`${colors.blue}Testing: ${receipt.id} (${receipt.store_type})...${colors.reset}`);

    const pdfPath = path.join(__dirname, '../test-receipts/golden-set/', receipt.pdf_file);

    if (!fs.existsSync(pdfPath)) {
      console.warn(`${colors.yellow}  ⚠️ PDF file not found: ${receipt.pdf_file}. Skipping.${colors.reset}`);
      results.push({
        receipt_id: receipt.id,
        passed: false,
        errors: [`File not found: ${receipt.pdf_file}`],
        warnings: [],
        metrics: { items_matched: 0, items_expected: receipt.items_count, price_accuracy: 0 }
      });
      continue;
    }

    // Upload PDF to Supabase storage (temp)
    const pdfBuffer = fs.readFileSync(pdfPath);
    const storagePath = `test-receipts/regression/${Date.now()}_${receipt.pdf_file}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(storagePath, pdfBuffer, {
        upsert: true,
        contentType: 'application/pdf'
      });

    if (uploadError) {
      console.error(`${colors.red}  ❌ Upload failed for ${receipt.id}: ${uploadError.message}${colors.reset}`);
      results.push({
        receipt_id: receipt.id,
        passed: false,
        errors: [`Upload failed: ${uploadError.message}`],
        warnings: [],
        metrics: { items_matched: 0, items_expected: receipt.items_count, price_accuracy: 0 }
      });
      continue;
    }

    const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(storagePath);

    // Parse receipt
    const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-receipt', {
      body: {
        pdfUrl: publicUrl,
        parserVersion: 'structured-only' // Force structured parser for regression tests
      }
    });

    // Cleanup: Delete uploaded file
    await supabase.storage.from('receipts').remove([storagePath]);

    if (parseError) {
      console.error(`${colors.red}  ❌ Parse error: ${parseError.message}${colors.reset}`);
      results.push({
        receipt_id: receipt.id,
        passed: false,
        errors: [`Parse error: ${parseError.message}`],
        warnings: [],
        metrics: { items_matched: 0, items_expected: receipt.items_count, price_accuracy: 0 }
      });
      continue;
    }

    // Compare results
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check items count
    const actualItemsCount = parseResult.structured_items_count || parseResult.items?.length || 0;
    if (actualItemsCount !== receipt.items_count) {
      errors.push(`Items count mismatch: expected ${receipt.items_count}, got ${actualItemsCount}`);
    }

    // Check total amount
    const actualTotal = parseResult.total_amount || 0;
    if (Math.abs(actualTotal - receipt.total_amount) > 0.01) {
      errors.push(`Total amount mismatch: expected ${receipt.total_amount}, got ${actualTotal}`);
    }

    // Check for anomalies (if returned in parser_metadata)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anomalyCount = (parseResult as any).parser_metadata?.anomalies?.length || 0;
    if (anomalyCount > 0) {
      warnings.push(`${anomalyCount} anomalies detected in parsing`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parseResult as any).parser_metadata.anomalies.forEach((a: any) => {
        warnings.push(`  - ${a.type}: ${a.description}`);
      });
    }

    // Check for fallback (should not happen in structured-only mode, but good to check)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((parseResult as any).parser_metadata?.fallback_used) {
      errors.push('Structured parser failed, used AI fallback');
    }

    const passed = errors.length === 0;

    results.push({
      receipt_id: receipt.id,
      passed,
      errors,
      warnings,
      metrics: {
        items_matched: actualItemsCount,
        items_expected: receipt.items_count,
        price_accuracy: 100 // Placeholder
      }
    });

    if (passed) {
      console.log(`${colors.green}  ✅ PASS${colors.reset}`);
      if (warnings.length > 0) {
        warnings.forEach(w => console.log(`${colors.yellow}     ⚠️ ${w}${colors.reset}`));
      }
    } else {
      console.log(`${colors.red}  ❌ FAIL${colors.reset}`);
      errors.forEach(e => console.log(`${colors.red}     - ${e}${colors.reset}`));
    }
  }

  return results;
}

async function main() {
  const results = await runRegressionTests();

  if (results.length === 0) {
    console.log('No tests executed.');
    return;
  }

  // Generate report
  const passCount = results.filter(r => r.passed).length;
  const failCount = results.length - passCount;

  console.log('\n=== TEST SUMMARY ===');
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);

  const passRate = (passCount / results.length) * 100;
  console.log(`Pass Rate: ${passRate.toFixed(1)}%\n`);

  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log(`${colors.green}All tests passed! 🚀${colors.reset}`);
  }
}

main();
