# Golden Receipt Set

This directory contains the "Golden Set" of receipts used for automated regression testing. These receipts act as a known-good baseline to ensure that parser updates do not break existing functionality.

## Directory Structure

```
test-receipts/golden-set/
├── README.md               # This file
├── golden-set-index.json   # Registry of all test cases and expectations
├── [RECEIPT_ID].pdf        # The original receipt PDF
└── [RECEIPT_ID].json       # The expected full JSON output (optional, for deep diff)
```

## How to Add a New Test Case

1.  **Find a challenging receipt**: Choose a receipt that covers a specific edge case (e.g., multi-buy discounts, pant, difficult layout) or represents a standard format for a major chain.
2.  **Parse & Verify**: Run it through the parser manually and verify the output is **100% correct**.
3.  **Add Files**:
    *   Copy the PDF here as `[STORE]_[DATE].pdf`.
    *   (Optional) Save the full parsed JSON as `[STORE]_[DATE].json`.
4.  **Update Registry**: Add an entry to `golden-set-index.json`:

```json
{
  "id": "willys-hero-2025",
  "store_type": "Willys",
  "pdf_file": "Willys_Hero_2025.pdf",
  "expected_file": "Willys_Hero_2025.json",
  "items_count": 32,
  "total_amount": 1450.50,
  "notes": "Tests multi-line items and discounts"
}
```

## Running Tests

Run the regression suite locally:

```bash
npm run test:regression
```

*Note: You need a `.env` file with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.*
