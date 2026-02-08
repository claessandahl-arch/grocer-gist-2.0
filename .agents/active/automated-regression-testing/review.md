severity: low
file: scripts/test-parser-regression.ts
line: 160
issue: Use of `any` casting for `parser_metadata` bypasses type safety
suggestion: Accepted. The Edge Function response type is not shared with the script environment. `eslint-disable` added.

severity: medium
file: test-receipts/golden-set/golden-set-index.json
line: 8
issue: Contains placeholder entry `ICA_Kvantum_Example.pdf` without matching file
suggestion: User action required: Add `ICA_Kvantum_Example.pdf` or remove the entry before running tests. Script gracefully warns about missing files but still returns passed if no tests run.
