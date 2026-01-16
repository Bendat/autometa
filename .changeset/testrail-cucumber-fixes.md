---
"@autometa/testrail-cucumber": patch
---

### Bug Fixes

- **Fixed duplicate test case creation**: When using `outlineIs=section` + `exampleIs=section`, existing row cases in nested sections (outline → example → rows) are now properly matched. Previously, cases were only searched in the feature section and direct children, causing new cases to be created on each sync.

- **Fixed inline tag placement adding duplicate columns**: The `exampleCaseTagPlacement=inline` mode now properly updates existing `testrail case` columns instead of appending additional columns on each run.

- **Fixed indentation preservation**: Table rows now preserve their leading whitespace when updating inline case tags.

### Features

- **Added automatic Gherkin formatting**: Feature files are now formatted using `@cucumber/gherkin-utils` after tag writeback, ensuring consistent indentation and aligned table columns.

- **Exported `formatFeatureFile` function**: The new formatter is available for programmatic use.
