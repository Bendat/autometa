# @autometa/assertions

## 1.0.0-rc.2

### Patch Changes

- Updated dependencies [194871e0]
- Updated dependencies [1bd3dbe5]
  - @autometa/injection@1.0.0-rc.2
  - @autometa/executor@1.0.0-rc.2
  - @autometa/gherkin@1.0.0-rc.2
  - @autometa/cucumber-expressions@1.0.0-rc.2

## 1.0.0-rc.1

### Patch Changes

- Roll prerelease tag to rc.1+ for the v1 rewrite packages (rc2 drop).
- Updated dependencies
  - @autometa/cucumber-expressions@1.0.0-rc.1
  - @autometa/executor@1.0.0-rc.1
  - @autometa/gherkin@1.0.0-rc.1
  - @autometa/injection@1.0.0-rc.1
  - @autometa/scopes@1.0.0-rc.1

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
  - @autometa/cucumber-expressions@1.0.0-rc.0
  - @autometa/executor@1.0.0-rc.0
  - @autometa/gherkin@1.0.0-rc.0
  - @autometa/injection@1.0.0-rc.0
  - @autometa/scopes@1.0.0-rc.0

> Changelog initialized during the Autometa v1 rewrite. Earlier releases were tracked inside the combined Autometa documentation set.
