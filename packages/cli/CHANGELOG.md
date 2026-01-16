# @autometa/cli

## 1.0.0-rc.5

### Patch Changes

- @autometa/executor@1.0.0-rc.3
- @autometa/coordinator@1.0.0-rc.3
- @autometa/runner@1.0.0-rc.3
- @autometa/http@2.0.0-rc.3

## 1.0.0-rc.4

### Minor Changes

- 1a0eebfa: feat(cli): add --config flag and enhance config discovery

  - New `--config` / `-c` flag to point the CLI at a specific Autometa config file.
  - Broader default discovery: searches upward from the current directory for:
    - `autometa.config.{ts,mts,cts,js,mjs,cjs}`
    - `autometa.<name>.config.{ts,mts,cts,js,mjs,cjs}` (e.g. `autometa.e2e.config.ts`)
  - This improves "global install" usage and aligns config ergonomics with tools like Vitest/Jest.

### Patch Changes

- Updated dependencies [680641ec]
- Updated dependencies [1bd3dbe5]
- Updated dependencies [194871e0]
- Updated dependencies [14eebacf]
- Updated dependencies [1bd3dbe5]
  - @autometa/runner@1.0.0-rc.2
  - @autometa/http@2.0.0-rc.2
  - @autometa/errors@1.0.0-rc.2
  - @autometa/executor@1.0.0-rc.2
  - @autometa/gherkin@1.0.0-rc.2
  - @autometa/config@1.0.0-rc.2
  - @autometa/coordinator@1.0.0-rc.2
  - @autometa/test-builder@1.0.0-rc.2

## 1.0.0-rc.3

### Patch Changes

- Roll prerelease tag to rc.1+ for the v1 rewrite packages (rc2 drop).
- Updated dependencies
  - @autometa/config@1.0.0-rc.1
  - @autometa/coordinator@1.0.0-rc.1
  - @autometa/errors@1.0.0-rc.1
  - @autometa/executor@1.0.0-rc.1
  - @autometa/gherkin@1.0.0-rc.1
  - @autometa/http@2.0.0-rc.1
  - @autometa/runner@1.0.0-rc.1
  - @autometa/scopes@1.0.0-rc.1
  - @autometa/test-builder@1.0.0-rc.1

## 1.0.0-rc.2

### Patch Changes

- d00f39be: Fix publish workflow to trigger correctly on releases

## 1.0.0-rc.1

### Patch Changes

- a63c4734: Publish 1.0.0-rc.0 packages and fix CI workflows

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

### Patch Changes

- Updated dependencies [39896e93]
  - @autometa/config@1.0.0-rc.0
  - @autometa/coordinator@1.0.0-rc.0
  - @autometa/errors@1.0.0-rc.0
  - @autometa/executor@1.0.0-rc.0
  - @autometa/gherkin@1.0.0-rc.0
  - @autometa/http@2.0.0-rc.0
  - @autometa/runner@1.0.0-rc.0
  - @autometa/scopes@1.0.0-rc.0
  - @autometa/test-builder@1.0.0-rc.0

> Changelog initialized during the Autometa v1 rewrite. Earlier CLI builds were experimental and undocumented.
