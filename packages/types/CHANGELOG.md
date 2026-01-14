# Gherkin

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

## 0.4.1

### Patch Changes

- 53f958e1: Fix: steps not executing onStepEnded event when an error was thrown

## 0.4.0

### Minor Changes

- 554b77e: Releasing packages

## 0.3.1

### Patch Changes

- 6a4a9ac: Swapped project type to "composite", unified build system for most projects

## 0.3.0

### Minor Changes

- b48f577: Added initial implemention of scopes and updated `overloads`

## 0.2.1

### Patch Changes

- cfc35f4: Update build systems on packages to use tsup

## 0.2.0

### Minor Changes

- 0a27508: Created "gherkin" package to help split up cucumber-runner
