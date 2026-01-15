# @autometa/jest-executor

## 1.0.0-rc.4

### Patch Changes

- Updated dependencies [194871e0]
- Updated dependencies [1bd3dbe5]
  - @autometa/executor@1.0.0-rc.2
  - @autometa/config@1.0.0-rc.2
  - @autometa/test-builder@1.0.0-rc.2

## 1.0.0-rc.3

### Patch Changes

- Roll prerelease tag to rc.1+ for the v1 rewrite packages (rc2 drop).
- Updated dependencies
  - @autometa/config@1.0.0-rc.1
  - @autometa/executor@1.0.0-rc.1
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
  - @autometa/executor@1.0.0-rc.0
  - @autometa/scopes@1.0.0-rc.0
  - @autometa/test-builder@1.0.0-rc.0

## 0.6.4

### Patch Changes

- 11859b0: fix: incorrect group filtering pt 2

## 0.6.3

### Patch Changes

- 57e6e0e: fix(jest): incorrectly skipping groups with skipped children

## 0.6.2

### Patch Changes

- 8df323c: feat: tag filters for disposer methods
- Updated dependencies [8df323c]
  - @autometa/injection@0.1.5
  - @autometa/app@0.4.2
  - @autometa/gherkin@0.7.2
  - @autometa/scopes@0.7.2
  - @autometa/test-builder@0.4.2
  - @autometa/config@0.1.27
  - @autometa/events@0.3.2

## 0.6.1

### Patch Changes

- da669a3: feat: disposable injectables
- Updated dependencies [da669a3]
  - @autometa/injection@0.1.4
  - @autometa/app@0.4.1
  - @autometa/config@0.1.26
  - @autometa/scopes@0.7.1
  - @autometa/test-builder@0.4.1
  - @autometa/gherkin@0.7.1
  - @autometa/events@0.3.1

## 0.6.0

### Minor Changes

- 7440e9f: feat: new group based hooks for feature, rule, outline and examples

### Patch Changes

- Updated dependencies [7440e9f]
  - @autometa/test-builder@0.4.0
  - @autometa/gherkin@0.7.0
  - @autometa/events@0.3.0
  - @autometa/scopes@0.7.0
  - @autometa/app@0.4.0
  - @autometa/config@0.1.25

## 0.5.10

### Patch Changes

- Updated dependencies [205ee3b]
  - @autometa/gherkin@0.6.15
  - @autometa/events@0.2.27
  - @autometa/scopes@0.6.6
  - @autometa/test-builder@0.3.8

## 0.5.9

### Patch Changes

- Updated dependencies [bc46a37]
  - @autometa/test-builder@0.3.7

## 0.5.8

### Patch Changes

- 23dacf2: fix: non negative tag filters being skipped when group is untagged
- Updated dependencies [23dacf2]
  - @autometa/test-builder@0.3.6

## 0.5.7

### Patch Changes

- Updated dependencies [1d3f84e]
  - @autometa/app@0.3.5
  - @autometa/config@0.1.24
  - @autometa/scopes@0.6.5
  - @autometa/test-builder@0.3.5

## 0.5.6

### Patch Changes

- 6e2203c: feat: transformers for table documents, retry scenarios and examples
- Updated dependencies [6e2203c]
  - @autometa/gherkin@0.6.14
  - @autometa/events@0.2.26
  - @autometa/scopes@0.6.4
  - @autometa/test-builder@0.3.4

## 0.5.5

### Patch Changes

- f7fb5ae: fix: move retry logic to beforeAll hook

## 0.5.4

### Patch Changes

- ba8c1f7: feat: use tags to retry feature or rule groups

## 0.5.3

### Patch Changes

- Updated dependencies [bf6e5dd]
  - @autometa/gherkin@0.6.13
  - @autometa/events@0.2.25
  - @autometa/scopes@0.6.3
  - @autometa/test-builder@0.3.3

## 0.5.2

### Patch Changes

- Updated dependencies [c9cc41c]
  - @autometa/test-builder@0.3.2
  - @autometa/gherkin@0.6.12
  - @autometa/events@0.2.24
  - @autometa/scopes@0.6.2

## 0.5.1

### Patch Changes

- be770fc: fix: title interpolation for outlines and their steps
- Updated dependencies [be770fc]
  - @autometa/gherkin@0.6.11
  - @autometa/events@0.2.23
  - @autometa/scopes@0.6.1
  - @autometa/test-builder@0.3.1

## 0.5.0

### Minor Changes

- 884c9dd: Add support to access App instance from cucumber expression transformer

### Patch Changes

- Updated dependencies [884c9dd]
  - @autometa/test-builder@0.3.0
  - @autometa/scopes@0.6.0

## 0.4.17

### Patch Changes

- 7a2a8ba: fix: features not skipping with tag filter

## 0.4.16

### Patch Changes

- 74f7d30: fix(jest-executor): tagFilter not working correctly

## 0.4.15

### Patch Changes

- Updated dependencies [51ad241]
  - @autometa/gherkin@0.6.10
  - @autometa/events@0.2.22
  - @autometa/scopes@0.5.12
  - @autometa/test-builder@0.2.13

## 0.4.14

### Patch Changes

- @autometa/gherkin@0.6.9
- @autometa/scopes@0.5.11
- @autometa/test-builder@0.2.12
- @autometa/events@0.2.21

## 0.4.13

### Patch Changes

- Updated dependencies [4e78dc4]
  - @autometa/scopes@0.5.10
  - @autometa/test-builder@0.2.11

## 0.4.12

### Patch Changes

- Updated dependencies [7a10612]
  - @autometa/scopes@0.5.9
  - @autometa/test-builder@0.2.10

## 0.4.11

### Patch Changes

- Updated dependencies [2aee2a4]
  - @autometa/injection@0.1.3
  - @autometa/app@0.3.4
  - @autometa/gherkin@0.6.8
  - @autometa/scopes@0.5.8
  - @autometa/test-builder@0.2.9
  - @autometa/config@0.1.23
  - @autometa/events@0.2.20

## 0.4.10

### Patch Changes

- bac2661: fix: world not defined on app
- Updated dependencies [536004e]
- Updated dependencies [bac2661]
  - @autometa/injection@0.1.2
  - @autometa/app@0.3.3
  - @autometa/gherkin@0.6.7
  - @autometa/scopes@0.5.7
  - @autometa/test-builder@0.2.8
  - @autometa/config@0.1.22
  - @autometa/events@0.2.19

## 0.4.9

### Patch Changes

- @autometa/gherkin@0.6.6
- @autometa/scopes@0.5.6
- @autometa/test-builder@0.2.7
- @autometa/events@0.2.18

## 0.4.8

### Patch Changes

- @autometa/gherkin@0.6.5
- @autometa/scopes@0.5.5
- @autometa/test-builder@0.2.6
- @autometa/events@0.2.17

## 0.4.7

### Patch Changes

- @autometa/gherkin@0.6.4
- @autometa/scopes@0.5.4
- @autometa/test-builder@0.2.5
- @autometa/events@0.2.16

## 0.4.6

### Patch Changes

- Updated dependencies
  - @autometa/gherkin@0.6.3
  - @autometa/scopes@0.5.3
  - @autometa/test-builder@0.2.4
  - @autometa/events@0.2.15

## 0.4.5

### Patch Changes

- @autometa/gherkin@0.6.2
- @autometa/scopes@0.5.2
- @automета/test-builder@0.2.3
- @automета/events@0.2.14

## 0.4.4

### Patch Changes

- @autometa/gherkin@0.6.1
- @autometa/scopes@0.5.1
- @autometa/test-builder@0.2.2
- @autometa/events@0.2.13

## 0.4.3

### Patch Changes

- Updated dependencies [7e9d2bc]
  - @autometa/gherkin@0.6.0
  - @autometa/scopes@0.5.0
  - @autometa/test-builder@0.2.1
  - @autometa/events@0.2.12

## 0.4.2

### Patch Changes

- Updated dependencies [d563916]
  - @autometa/test-builder@0.2.0
  - @autometa/injection@0.1.1
  - @autometa/gherkin@0.5.8
  - @autometa/scopes@0.4.14
  - @autometa/app@0.3.2
  - @autometa/events@0.2.11
  - @autometa/config@0.1.21

## 0.4.1

### Patch Changes

- Updated dependencies [6c4bb8d]
  - @autometa/app@0.3.1
  - @autometa/config@0.1.20
  - @autometa/scopes@0.4.13
  - @autometa/test-builder@0.1.42

## 0.4.0

### Minor Changes

- 98d911f: feat: replace tsyringe with custom DI solution

### Patch Changes

- Updated dependencies [98d911f]
  - @autometa/injection@0.1.0
  - @autometa/app@0.3.0
  - @autometa/config@0.1.19
  - @autometa/scopes@0.4.12
  - @autometa/test-builder@0.1.41

## 0.3.9

### Patch Changes

- Updated dependencies [3fe2ad4]
  - @autometa/errors@0.2.2
  - @autometa/app@0.2.4
  - @autometa/asserters@0.1.8
  - @autometa/config@0.1.18
  - @autometa/events@0.2.10
  - @autometa/gherkin@0.5.7
  - @autometa/scopes@0.4.11
  - @autometa/test-builder@0.1.40

## 0.3.8

### Patch Changes

- Updated dependencies [3493bb6]
  - @autometa/errors@0.2.1
  - @autometa/app@0.2.3
  - @autometa/asserters@0.1.7
  - @automета/config@0.1.17
  - @automета/events@0.2.9
  - @automета/gherkin@0.5.6
  - @automета/scopes@0.4.10
  - @automета/test-builder@0.1.39

...
