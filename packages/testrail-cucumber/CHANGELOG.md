# @autometa/testrail-cucumber

## 1.0.0-rc.2

### Minor Changes

- 76a45c2b: ### @autometa/events

  - Add `currentScope`, `docstring`, and `table` fields to `EventEnvelope` for richer listener context
  - `currentScope: ExecutionScope` is derived from the event type (feature, scenario, step, etc.)
  - `docstring?: EnvelopeDocstring` contains the step's docstring content and optional mediaType
  - `table?: readonly (readonly string[])[]` contains the step's data table as a 2D array
  - Refactor `EventDispatcher.dispatch()` to accept `DispatchContext` instead of a plain tags array

  ### @autometa/testrail-cucumber

  - Add `login` command to store TestRail credentials securely on the user's device
  - Add `logout` command to remove stored credentials
  - Add `set-url` command to update the stored URL without re-entering credentials
  - Add `set-project` command to update the default project ID without re-entering credentials
  - Stored credentials are used automatically when CLI flags are omitted

- 543dfc69: bug fixes in testrails, default interactive mode, better write backs and config

### Patch Changes

- 543dfc69: ### Bug Fixes

  - **Fixed duplicate test case creation**: When using `outlineIs=section` + `exampleIs=section`, existing row cases in nested sections (outline → example → rows) are now properly matched. Previously, cases were only searched in the feature section and direct children, causing new cases to be created on each sync.

  - **Fixed inline tag placement adding duplicate columns**: The `exampleCaseTagPlacement=inline` mode now properly updates existing `testrail case` columns instead of appending additional columns on each run.

  - **Fixed indentation preservation**: Table rows now preserve their leading whitespace when updating inline case tags.

  ### Features

  - **Added automatic Gherkin formatting**: Feature files are now formatted using `@cucumber/gherkin-utils` after tag writeback, ensuring consistent indentation and aligned table columns.

  - **Exported `formatFeatureFile` function**: The new formatter is available for programmatic use.

## 1.0.0-rc.1

### Patch Changes

- Roll prerelease tag to rc.1+ for the v1 rewrite packages (rc2 drop).

## 1.0.0-rc.0

### Major Changes

- 39896e93: Autometa v1 rewrite: start the `-rc` prerelease line for the new major version series (HTTP is a breaking change from v1 and becomes v2).

  This release candidate includes:

  **Breaking Changes:**

  - Complete v1 rewrite with new architecture and API
  - HTTP package breaking changes (now v2)

  **Fixes:**

  - `dto-builder`: Omit undefined validator in extend config
  - `dto-builder`: Factory extend with defaults and methods support
  - `test-builder`: Avoid non-null assertions in edit distance calculation
  - `assertions`: Move HTTP matcher placeholder out of test files
  - `runner`: Make JSON.stringify(world) safe
  - `http`: Avoid double query serialization in axios transport

  **Improvements:**

  - `testrail-cucumber`: Harden Gherkin parsing and attach rule metadata
  - `cli`: Improve test stability (ANSI color handling, control regex)
  - `bind-decorator`: Add error case test coverage to meet 90% threshold
  - Build stability: Isolated tsbuildinfo for type builds
  - CI workflows: Fixed shell quoting in version detection across all workflows
  - Examples: Align tsconfigs and use this-bound step functions

  **Documentation:**

  - Expanded lifecycle and runtime architecture docs
  - New discovery and from-scratch getting started guides
  - Updated configuration and HTTP client reference
