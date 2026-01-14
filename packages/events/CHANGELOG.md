# @autometa/events

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
  - @autometa/gherkin@1.0.0-rc.0
  - @autometa/injection@1.0.0-rc.0

## 0.3.2

### Patch Changes

- @autometa/gherkin@0.7.2

## 0.3.1

### Patch Changes

- @autometa/gherkin@0.7.1

## 0.3.0

### Minor Changes

- 7440e9f: feat: new group based hooks for feature, rule, outline and examples

### Patch Changes

- Updated dependencies [7440e9f]
  - @autometa/gherkin@0.7.0

## 0.2.27

### Patch Changes

- Updated dependencies [205ee3b]
  - @autometa/gherkin@0.6.15

## 0.2.26

### Patch Changes

- Updated dependencies [6e2203c]
  - @autometa/gherkin@0.6.14

## 0.2.25

### Patch Changes

- Updated dependencies [bf6e5dd]
  - @autometa/gherkin@0.6.13

## 0.2.24

### Patch Changes

- Updated dependencies [c9cc41c]
  - @autometa/gherkin@0.6.12

## 0.2.23

### Patch Changes

- Updated dependencies [be770fc]
  - @autometa/gherkin@0.6.11

## 0.2.22

### Patch Changes

- Updated dependencies [51ad241]
  - @autometa/gherkin@0.6.10

## 0.2.21

### Patch Changes

- @autometa/gherkin@0.6.9

## 0.2.20

### Patch Changes

- @autometa/gherkin@0.6.8

## 0.2.19

### Patch Changes

- @autometa/gherkin@0.6.7

## 0.2.18

### Patch Changes

- @autometa/gherkin@0.6.6

## 0.2.17

### Patch Changes

- @autometa/gherkin@0.6.5

## 0.2.16

### Patch Changes

- @autometa/gherkin@0.6.4

## 0.2.15

### Patch Changes

- Updated dependencies
  - @autometa/gherkin@0.6.3

## 0.2.14

### Patch Changes

- @autometa/gherkin@0.6.2

## 0.2.13

### Patch Changes

- @autometa/gherkin@0.6.1

## 0.2.12

### Patch Changes

- Updated dependencies [7e9d2bc]
  - @autometa/gherkin@0.6.0

## 0.2.11

### Patch Changes

- Updated dependencies [d563916]
  - @autometa/gherkin@0.5.8

## 0.2.10

### Patch Changes

- Updated dependencies [3fe2ad4]
  - @autometa/errors@0.2.2
  - @autometa/gherkin@0.5.7

## 0.2.9

### Patch Changes

- Updated dependencies [3493bb6]
  - @autometa/errors@0.2.1
  - @autometa/gherkin@0.5.6

## 0.2.8

### Patch Changes

- @autometa/gherkin@0.5.5

## 0.2.7

### Patch Changes

- Updated dependencies [6fe8f64]
  - @autometa/gherkin@0.5.4

## 0.2.6

### Patch Changes

- Updated dependencies [b5ce008]
  - @autometa/errors@0.2.0
  - @autometa/gherkin@0.5.3

## 0.2.5

### Patch Changes

- 04ed85d: feat: added HTP client based on axios
- Updated dependencies [04ed85d]
  - @autometa/gherkin@0.5.2
  - @autometa/errors@0.1.4

## 0.2.4

### Patch Changes

- Updated dependencies [4b796f8]
  - @autometa/gherkin@0.5.1

## 0.2.3

### Patch Changes

- Updated dependencies [329c6b8]
  - @autometa/gherkin@0.5.0

## 0.2.2

### Patch Changes

- fix: exporting event types

## 0.2.1

### Patch Changes

- 3672161c: Fix: export event option types

## 0.2.0

### Minor Changes

- 51d88780: Feat: Add Async Test Event support to new runner

## 0.1.6

### Patch Changes

- 53f958e1: Fix: steps not executing onStepEnded event when an error was thrown
- Updated dependencies [53f958e1]
  - @autometa/errors@0.1.3
  - @autometa/gherkin@0.4.5
  - @autometa/types@0.4.1

## 0.1.5

### Patch Changes

- Updated dependencies [12bd4b1e]
  - @autometa/errors@0.1.2
  - @autometa/gherkin@0.4.4

## 0.1.4

### Patch Changes

- ff45dc43: fix(jest-executor): step text was not correctly logged

## 0.1.3

### Patch Changes

- 29ed7239: fix(test-builder): onStepStart event not firing
- Updated dependencies [29ed7239]
  - @autometa/gherkin@0.4.3

## 0.1.2

### Patch Changes

- @autometa/gherkin@0.4.2

## 0.1.1

### Patch Changes

- Updated dependencies [e8f02f3a]
  - @autometa/gherkin@0.4.1
  - @autometa/errors@0.1.1

## 0.1.0

### Minor Changes

- 554b77e: Releasing packages

### Patch Changes

- Updated dependencies [554b77e]
  - @autometa/errors@0.1.0
  - @autometa/gherkin@0.4.0
  - @autometa/types@0.4.0

## 0.0.10

### Patch Changes

- @autometa/gherkin@0.3.3

## 0.0.9

### Patch Changes

- @autometa/gherkin@0.3.2

## 0.0.8

### Patch Changes

- 6a4a9ac: Swapped project type to "composite", unified build system for most projects
- Updated dependencies [6a4a9ac]
  - @autometa/gherkin@0.3.1
  - @autometa/types@0.3.1

## 0.0.7

### Patch Changes

- Updated dependencies [b48f577]
  - @autometa/gherkin@0.3.0
  - @autometa/types@0.3.0
  - @autometa/dto-builder@0.9.1

## 0.0.6

### Patch Changes

- Updated dependencies [a874510]
  - @autometa/dto-builder@0.9.0
  - @autometa/gherkin@0.2.5

## 0.0.5

### Patch Changes

- bc5e12c: Added 'overloaded' package for overloaded or pattern matched functins and methods
- Updated dependencies [bc5e12c]
  - @autometa/gherkin@0.2.4

## 0.0.4

### Patch Changes

- Updated dependencies [64bacd4]
  - @autometa/gherkin@0.2.3

## 0.0.3

### Patch Changes

- Updated dependencies [064b589]
  - @autometa/dto-builder@0.8.0
  - @autometa/gherkin@0.2.2

## 0.0.2

### Patch Changes

- Updated dependencies [cfc35f4]
  - @autometa/dto-builder@0.7.1
  - @autometa/gherkin@0.2.1
  - @autometa/types@0.2.1
