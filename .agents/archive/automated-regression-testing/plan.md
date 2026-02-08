# Feature: Automated Regression Testing (Parser Guardrails)

## Description
Implements Phase 5 of the Parser Enhancement Roadmap: a robust automated regression testing system. This system prevents parser logic regressions (like the "Sunny Soda" qty=52 bug) by verifying the parser against a curated "Golden Set" of known-good receipts. It includes a local script for developers and a CI/CD workflow for automated nightly checks.

## User Story
**As a** Developer
**I want to** run a single command `npm run test:regression` to verify my changes haven't broken existing parser logic
**So that** I can refactor and improve the parser with confidence, knowing regressions will be caught immediately.

## Files to Create/Modify

### 1. Test Data Structure (New)
*   **Create:** `test-receipts/golden-set/` directory.
*   **Create:** `test-receipts/golden-set/golden-set-index.json` (Registry of test cases).
*   **Create:** `test-receipts/golden-set/README.md` (Instructions).

### 2. Test Runner Script (New)
*   **Create:** `scripts/test-parser-regression.ts`
    *   **Logic:**
        1.  Reads `golden-set-index.json`.
        2.  Uploads PDF from `test-receipts/golden-set/` to a temporary Supabase storage path.
        3.  Calls `parse-receipt` Edge Function.
        4.  Compares result against expected values (item count, total amount, specific items).
        5.  Reports Pass/Fail/Warnings.
    *   **Dependencies:** `dotenv` (for local secrets), `@supabase/supabase-js`.

### 3. CI/CD Integration (New)
*   **Create:** `.github/workflows/parser-regression-test.yml`
    *   **Trigger:** Manual dispatch + Scheduled (Daily).
    *   **Steps:** Checkout -> Setup Node -> Install Deps -> Run Script.
    *   **Secrets:** Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### 4. Package Configuration (Modify)
*   **Modify:** `package.json`
    *   Add script `test:regression`.

## Step-by-Step Tasks

### Phase 1: Test Infrastructure Setup
1.  [ ] **Create Directories**: Set up `test-receipts/golden-set`.
2.  [ ] **Create Index**: Initialize `golden-set-index.json` with schema validation structure.
3.  [ ] **Create README**: Document how to add new test cases.

### Phase 2: Test Runner Implementation
4.  [ ] **Develop Script**: Write `scripts/test-parser-regression.ts`.
    *   Implement PDF upload logic (handling duplicates/cleanup).
    *   Implement "Deep Compare" logic (fuzzy match for item names if needed, or strict for total/count).
    *   Add colorized console output for DX.
5.  [ ] **Add NPM Script**: Update `package.json`.

### Phase 3: CI/CD Workflow
6.  [ ] **Create Workflow**: Write `.github/workflows/parser-regression-test.yml`.
    *   Configure it to run on `ubuntu-latest`.
    *   Ensure it fails the build if the script exits with non-zero code.

### Phase 4: Initial Data Population
7.  [ ] **Add Baseline Case**: Add *one* existing known receipt (e.g., the Willys or ICA receipt used in previous manual tests) to the Golden Set as a proof-of-concept.
    *   *Note*: Actual PDF files must be manually added by the user later due to CLI limitations, but I will create the metadata entry for it.

## Testing Strategy

*   **Local Execution**:
    *   Run `npm run test:regression`.
    *   Verify it connects to Supabase, uploads the file, and validates the response.
*   **Failure Simulation**:
    *   Temporarily modify the expected items count in `golden-set-index.json`.
    *   Run script -> Should fail ❌.
*   **Success Verification**:
    *   Run with correct expectations -> Should pass ✅.

## Validation Commands
```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint
npm run lint

# 3. Run Regression Test (requires .env with SUPABASE credentials)
npm run test:regression
```

## Acceptance Criteria
- [ ] `npm run test:regression` executes successfully.
- [ ] Script accurately reports Pass/Fail based on `golden-set-index.json` expectations.
- [ ] GitHub Workflow file is valid (lint check).
- [ ] Documentation explains how to maintain the Golden Set.
