# @autometa/coordinator

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
  - @autometa/errors@1.0.0-rc.0
  - @autometa/executor@1.0.0-rc.0
  - @autometa/gherkin@1.0.0-rc.0
  - @autometa/scopes@1.0.0-rc.0
  - @autometa/test-builder@1.0.0-rc.0

## 0.3.33

### Patch Changes

- Updated dependencies [11859b0]
  - @autometa/jest-executor@0.6.4

## 0.3.32

### Patch Changes

- Updated dependencies [57e6e0e]
  - @autometa/jest-executor@0.6.3

## 0.3.31

### Patch Changes

- Updated dependencies [8df323c]
  - @autometa/jest-executor@0.6.2
  - @autometa/app@0.4.2
  - @autometa/gherkin@0.7.2
  - @autometa/scopes@0.7.2
  - @autometa/test-builder@0.4.2
  - @autometa/config@0.1.27
  - @autometa/events@0.3.2

## 0.3.30

### Patch Changes

- Updated dependencies [da669a3]
  - @autometa/jest-executor@0.6.1
  - @autometa/app@0.4.1
  - @autometa/config@0.1.26
  - @autometa/scopes@0.7.1
  - @autometa/test-builder@0.4.1
  - @autometa/gherkin@0.7.1
  - @autometa/events@0.3.1

## 0.3.29

### Patch Changes

- Updated dependencies [7440e9f]
  - @autometa/jest-executor@0.6.0
  - @autometa/test-builder@0.4.0
  - @autometa/gherkin@0.7.0
  - @autometa/events@0.3.0
  - @autometa/scopes@0.7.0
  - @autometa/app@0.4.0
  - @autometa/config@0.1.25

## 0.3.28

### Patch Changes

- Updated dependencies [205ee3b]
  - @autometa/gherkin@0.6.15
  - @autometa/events@0.2.27
  - @autometa/jest-executor@0.5.10
  - @autometa/scopes@0.6.6
  - @autometa/test-builder@0.3.8

## 0.3.27

### Patch Changes

- Updated dependencies [bc46a37]
  - @autometa/test-builder@0.3.7
  - @autometa/jest-executor@0.5.9

## 0.3.26

### Patch Changes

- Updated dependencies [23dacf2]
  - @autometa/jest-executor@0.5.8
  - @autometa/test-builder@0.3.6

## 0.3.25

### Patch Changes

- Updated dependencies [1d3f84e]
  - @autometa/app@0.3.5
  - @autometa/config@0.1.24
  - @autometa/jest-executor@0.5.7
  - @autometa/scopes@0.6.5
  - @autometa/test-builder@0.3.5

## 0.3.24

### Patch Changes

- Updated dependencies [6e2203c]
  - @autometa/jest-executor@0.5.6
  - @autometa/gherkin@0.6.14
  - @autometa/events@0.2.26
  - @autometa/scopes@0.6.4
  - @autometa/test-builder@0.3.4

## 0.3.23

### Patch Changes

- Updated dependencies [f7fb5ae]
  - @autometa/jest-executor@0.5.5

## 0.3.22

### Patch Changes

- Updated dependencies [ba8c1f7]
  - @autometa/jest-executor@0.5.4

## 0.3.21

### Patch Changes

- Updated dependencies [bf6e5dd]
  - @autometa/gherkin@0.6.13
  - @autometa/events@0.2.25
  - @autometa/jest-executor@0.5.3
  - @autometa/scopes@0.6.3
  - @autometa/test-builder@0.3.3

## 0.3.20

### Patch Changes

- Updated dependencies [c9cc41c]
  - @autometa/test-builder@0.3.2
  - @autometa/gherkin@0.6.12
  - @autometa/jest-executor@0.5.2
  - @autometa/events@0.2.24
  - @autometa/scopes@0.6.2

## 0.3.19

### Patch Changes

- Updated dependencies [be770fc]
  - @autometa/jest-executor@0.5.1
  - @autometa/gherkin@0.6.11
  - @autometa/events@0.2.23
  - @autometa/scopes@0.6.1
  - @autometa/test-builder@0.3.1

## 0.3.18

### Patch Changes

- Updated dependencies [884c9dd]
  - @autometa/jest-executor@0.5.0
  - @autometa/test-builder@0.3.0
  - @autometa/scopes@0.6.0

## 0.3.17

### Patch Changes

- Updated dependencies [7a2a8ba]
  - @autometa/jest-executor@0.4.17

## 0.3.16

### Patch Changes

- Updated dependencies [74f7d30]
  - @autometa/jest-executor@0.4.16

## 0.3.15

### Patch Changes

- Updated dependencies [51ad241]
  - @autometa/gherkin@0.6.10
  - @autometa/events@0.2.22
  - @autometa/jest-executor@0.4.15
  - @autometa/scopes@0.5.12
  - @autometa/test-builder@0.2.13

## 0.3.14

### Patch Changes

- @autometa/gherkin@0.6.9
- @autometa/scopes@0.5.11
- @autometa/test-builder@0.2.12
- @autometa/events@0.2.21
- @autometa/jest-executor@0.4.14

## 0.3.13

### Patch Changes

- Updated dependencies [4e78dc4]
  - @autometa/scopes@0.5.10
  - @autometa/jest-executor@0.4.13
  - @autometa/test-builder@0.2.11

## 0.3.12

### Patch Changes

- Updated dependencies [7a10612]
  - @autometa/scopes@0.5.9
  - @autometa/jest-executor@0.4.12
  - @autometa/test-builder@0.2.10

## 0.3.11

### Patch Changes

- @autometa/app@0.3.4
- @autometa/jest-executor@0.4.11
- @autometa/gherkin@0.6.8
- @autometa/scopes@0.5.8
- @autometa/test-builder@0.2.9
- @autometa/config@0.1.23
- @autometa/events@0.2.20

## 0.3.10

### Patch Changes

- Updated dependencies [536004e]
- Updated dependencies [bac2661]
  - @autometa/app@0.3.3
  - @autometa/jest-executor@0.4.10
  - @autometa/gherkin@0.6.7
  - @autometa/scopes@0.5.7
  - @autometa/test-builder@0.2.8
  - @autometa/config@0.1.22
  - @autometa/events@0.2.19

## 0.3.9

### Patch Changes

- @autometa/gherkin@0.6.6
- @autometa/scopes@0.5.6
- @autometa/test-builder@0.2.7
- @autometa/events@0.2.18
- @autometa/jest-executor@0.4.9

## 0.3.8

### Patch Changes

- @autometa/gherkin@0.6.5
- @autometa/scopes@0.5.5
- @autometa/test-builder@0.2.6
- @autometa/events@0.2.17
- @autometa/jest-executor@0.4.8

## 0.3.7

### Patch Changes

- @autometa/gherkin@0.6.4
- @autometa/scopes@0.5.4
- @autometa/test-builder@0.2.5
- @autometa/events@0.2.16
- @autometa/jest-executor@0.4.7

## 0.3.6

### Patch Changes

- Updated dependencies
  - @autometa/gherkin@0.6.3
  - @autometa/scopes@0.5.3
  - @autometa/test-builder@0.2.4
  - @autometa/events@0.2.15
  - @autometa/jest-executor@0.4.6

## 0.3.5

### Patch Changes

- @autometa/gherkin@0.6.2
- @autometa/scopes@0.5.2
- @autometa/test-builder@0.2.3
- @autometa/events@0.2.14
- @autometa/jest-executor@0.4.5

## 0.3.4

### Patch Changes

- @autometa/gherkin@0.6.1
- @autometa/scopes@0.5.1
- @autometa/test-builder@0.2.2
- @autometa/events@0.2.13
- @autometa/jest-executor@0.4.4

## 0.3.3

### Patch Changes

- Updated dependencies [7e9d2bc]
  - @autometa/gherkin@0.6.0
  - @autometa/scopes@0.5.0
  - @autometa/test-builder@0.2.1
  - @autometa/events@0.2.12
  - @autometa/jest-executor@0.4.3

## 0.3.2

### Patch Changes

- Updated dependencies [d563916]
  - @autometa/test-builder@0.2.0
  - @autometa/gherkin@0.5.8
  - @autometa/scopes@0.4.14
  - @autometa/jest-executor@0.4.2
  - @autometa/app@0.3.2
  - @autometa/events@0.2.11
  - @autometa/config@0.1.21

## 0.3.1

### Patch Changes

- Updated dependencies [6c4bb8d]
  - @autometa/app@0.3.1
  - @autometa/config@0.1.20
  - @autometa/jest-executor@0.4.1
  - @autometa/scopes@0.4.13
  - @autometa/test-builder@0.1.42

## 0.3.0

### Minor Changes

- 98d911f: feat: replace tsyringe with custom DI solution

### Patch Changes

- Updated dependencies [98d911f]
  - @autometa/jest-executor@0.4.0
  - @autometa/app@0.3.0
  - @autometa/config@0.1.19
  - @autometa/scopes@0.4.12
  - @autometa/test-builder@0.1.41

## 0.2.12

### Patch Changes

- Updated dependencies [3fe2ad4]
  - @autometa/errors@0.2.2
  - @autometa/app@0.2.4
  - @autometa/asserters@0.1.8
  - @autometa/config@0.1.18
  - @autometa/events@0.2.10
  - @autometa/gherkin@0.5.7
  - @autometa/jest-executor@0.3.9
  - @autometa/scopes@0.4.11
  - @autometa/test-builder@0.1.40

## 0.2.11

### Patch Changes

- Updated dependencies [3493bb6]
  - @autometa/errors@0.2.1
  - @autometa/app@0.2.3
  - @autometa/asserters@0.1.7
  - @autometa/config@0.1.17
  - @autometa/events@0.2.9
  - @autometa/gherkin@0.5.6
  - @autometa/jest-executor@0.3.8
  - @autometa/scopes@0.4.10
  - @autometa/test-builder@0.1.39

## 0.2.10

### Patch Changes

- Updated dependencies [eeccd7d]
  - @autometa/scopes@0.4.9
  - @autometa/jest-executor@0.3.7
  - @autometa/test-builder@0.1.38

## 0.2.9

### Patch Changes

- Updated dependencies [09ddb3c]
  - @autometa/jest-executor@0.3.6
  - @autometa/scopes@0.4.8
  - @autometa/test-builder@0.1.37

## 0.2.8

### Patch Changes

- @autometa/gherkin@0.5.5
- @autometa/scopes@0.4.7
- @autometa/test-builder@0.1.36
- @autometa/events@0.2.8
- @autometa/jest-executor@0.3.5

## 0.2.7

### Patch Changes

- Updated dependencies [edf1819]
  - @autometa/scopes@0.4.6
  - @autometa/jest-executor@0.3.4
  - @autometa/test-builder@0.1.35

## 0.2.6

### Patch Changes

- Updated dependencies [8ec0cdc]
  - @autometa/app@0.2.2
  - @autometa/config@0.1.16
  - @autometa/jest-executor@0.3.3
  - @autometa/scopes@0.4.5
  - @autometa/test-builder@0.1.34

## 0.2.5

### Patch Changes

- Updated dependencies [0c070cb]
  - @autometa/asserters@0.1.6
  - @autometa/app@0.2.1
  - @autometa/config@0.1.15
  - @autometa/jest-executor@0.3.2
  - @autometa/test-builder@0.1.33
  - @autometa/scopes@0.4.4

## 0.2.4

### Patch Changes

- Updated dependencies [6fe8f64]
  - @autometa/gherkin@0.5.4
  - @autometa/scopes@0.4.3
  - @autometa/events@0.2.7
  - @autometa/jest-executor@0.3.1
  - @autometa/test-builder@0.1.32

## 0.2.3

### Patch Changes

- Updated dependencies [b5ce008]
- Updated dependencies [8f116d9]
  - @autometa/jest-executor@0.3.0
  - @autometa/errors@0.2.0
  - @autometa/app@0.2.0
  - @autometa/asserters@0.1.5
  - @autometa/config@0.1.14
  - @autometa/events@0.2.6
  - @autometa/gherkin@0.5.3
  - @autometa/scopes@0.4.2
  - @autometa/test-builder@0.1.31

## 0.2.2

### Patch Changes

- Updated dependencies [4d8e52d]
  - @autometa/jest-executor@0.2.14

## 0.2.1

### Patch Changes

- 04ed85d: feat: added HTP client based on axios
- Updated dependencies [04ed85d]
  - @autometa/jest-executor@0.2.13
  - @autometa/test-builder@0.1.30
  - @autometa/asserters@0.1.4
  - @autometa/gherkin@0.5.2
  - @autometa/config@0.1.13
  - @autometa/errors@0.1.4
  - @autometa/events@0.2.5
  - @autometa/scopes@0.4.1
  - @autometa/app@0.1.13

## 0.2.0

### Minor Changes

- de6dad7: Feat: Expressions are now loaded using config

### Patch Changes

- Updated dependencies [de6dad7]
  - @autometa/scopes@0.4.0
  - @autometa/jest-executor@0.2.12
  - @autometa/test-builder@0.1.29

## 0.1.28

### Patch Changes

- @autometa/scopes@0.3.6
- @autometa/jest-executor@0.2.11
- @autometa/test-builder@0.1.28

## 0.1.27

### Patch Changes

- @autometa/scopes@0.3.5
- @autometa/jest-executor@0.2.10
- @autometa/test-builder@0.1.27

## 0.1.26

### Patch Changes

- @autometa/scopes@0.3.4
- @autometa/jest-executor@0.2.9
- @autometa/test-builder@0.1.26

## 0.1.25

### Patch Changes

- @autometa/scopes@0.3.3
- @autometa/jest-executor@0.2.8
- @autometa/test-builder@0.1.25

## 0.1.24

### Patch Changes

- Updated dependencies [4b796f8]
  - @autometa/gherkin@0.5.1
  - @autometa/events@0.2.4
  - @autometa/jest-executor@0.2.7
  - @autometa/scopes@0.3.2
  - @autometa/test-builder@0.1.24

## 0.1.23

### Patch Changes

- Updated dependencies [4ee4e99]
  - @autometa/scopes@0.3.1
  - @autometa/app@0.1.12
  - @autometa/jest-executor@0.2.6
  - @autometa/test-builder@0.1.23
  - @autometa/config@0.1.12

## 0.1.22

### Patch Changes

- Updated dependencies [329c6b8]
  - @autometa/gherkin@0.5.0
  - @autometa/scopes@0.3.0
  - @autometa/events@0.2.3
  - @autometa/jest-executor@0.2.5
  - @autometa/test-builder@0.1.22

## 0.1.21

### Patch Changes

- Release Bump
- Updated dependencies
  - @autometa/jest-executor@0.2.4
  - @autometa/test-builder@0.1.21
  - @autometa/config@0.1.11
  - @autometa/scopes@0.2.20
  - @autometa/app@0.1.11

## 0.1.20

### Patch Changes

- Updated dependencies [85050386]
  - @autometa/jest-executor@0.2.3
  - @autometa/app@0.1.10
  - @autometa/scopes@0.2.19
  - @autometa/test-builder@0.1.20
  - @autometa/config@0.1.10

## 0.1.19

### Patch Changes

- fix: exporting event types
- Updated dependencies
  - @autometa/jest-executor@0.2.2
  - @autometa/test-builder@0.1.19
  - @autometa/events@0.2.2
  - @autometa/scopes@0.2.18

## 0.1.18

### Patch Changes

- Updated dependencies [3672161c]
  - @autometa/events@0.2.1
  - @autometa/jest-executor@0.2.1
  - @autometa/scopes@0.2.17
  - @autometa/test-builder@0.1.18

## 0.1.17

### Patch Changes

- Updated dependencies [51d88780]
  - @autometa/jest-executor@0.2.0
  - @autometa/events@0.2.0
  - @autometa/scopes@0.2.16
  - @autometa/test-builder@0.1.17

## 0.1.16

### Patch Changes

- 5b44aa88: Fix: miscalculated Levenshtein distance when comparing a gherkin step literal to a cucumber expression with a string expression
- Updated dependencies [5b44aa88]
  - @autometa/jest-executor@0.1.16
  - @autometa/scopes@0.2.15
  - @autometa/test-builder@0.1.16

## 0.1.15

### Patch Changes

- 4af1139a: Fix: fuzzy search for step names prints malformed strings
- Updated dependencies [4af1139a]
  - @autometa/jest-executor@0.1.15
  - @autometa/scopes@0.2.14
  - @autometa/test-builder@0.1.15

## 0.1.14

### Patch Changes

- Updated dependencies [4bbb87e4]
  - @autometa/scopes@0.2.13
  - @autometa/jest-executor@0.1.14
  - @autometa/test-builder@0.1.14

## 0.1.13

### Patch Changes

- ddbdb401: Fix: World object not resolving correctly with DI
- Updated dependencies [ddbdb401]
  - @autometa/app@0.1.9
  - @autometa/jest-executor@0.1.13
  - @autometa/scopes@0.2.12
  - @autometa/test-builder@0.1.13
  - @autometa/config@0.1.9

## 0.1.12

### Patch Changes

- Updated dependencies [2cbc095e]
  - @autometa/test-builder@0.1.12
  - @autometa/jest-executor@0.1.12

## 0.1.11

### Patch Changes

- 53f958e1: Fix: steps not executing onStepEnded event when an error was thrown
- Updated dependencies [53f958e1]
  - @autometa/jest-executor@0.1.11
  - @autometa/scopes@0.2.11
  - @autometa/app@0.1.8
  - @autometa/asserters@0.1.3
  - @autometa/config@0.1.8
  - @autometa/errors@0.1.3
  - @autometa/events@0.1.6
  - @autometa/gherkin@0.4.5
  - @autometa/test-builder@0.1.11
  - @autometa/types@0.4.1

## 0.1.10

### Patch Changes

- Fix: bad dist published
- Updated dependencies
  - @autometa/jest-executor@0.1.10
  - @autometa/test-builder@0.1.10
  - @autometa/config@0.1.7
  - @autometa/scopes@0.2.10
  - @autometa/app@0.1.7

## 0.1.9

### Patch Changes

- f167963f: Fix: typo in AutometaWorld 'dfromPhrase' -> 'fromPhrase'
- Updated dependencies [f167963f]
  - @autometa/app@0.1.6
  - @autometa/scopes@0.2.9
  - @autometa/test-builder@0.1.9
  - @autometa/config@0.1.6
  - @autometa/jest-executor@0.1.9

## 0.1.8

### Patch Changes

- Updated dependencies [12bd4b1e]
  - @autometa/errors@0.1.2
  - @autometa/scopes@0.2.8
  - @autometa/app@0.1.5
  - @autometa/asserters@0.1.2
  - @autometa/config@0.1.5
  - @autometa/events@0.1.5
  - @autometa/gherkin@0.4.4
  - @autometa/jest-executor@0.1.8
  - @autometa/test-builder@0.1.8

## 0.1.7

### Patch Changes

- Updated dependencies [ff45dc43]
  - @autometa/jest-executor@0.1.7
  - @autometa/events@0.1.4
  - @autometa/scopes@0.2.7
  - @autometa/test-builder@0.1.7

## 0.1.6

### Patch Changes

- 29ed7239: fix(test-builder): onStepStart event not firing
- Updated dependencies [29ed7239]
  - @autometa/jest-executor@0.1.6
  - @autometa/test-builder@0.1.6
  - @autometa/gherkin@0.4.3
  - @autometa/events@0.1.3
  - @autometa/scopes@0.2.6

## 0.1.5

### Patch Changes

- 4a16497d: fix(scopes): hooks not executing without tag expressions
- Updated dependencies [4a16497d]
  - @autometa/scopes@0.2.5
  - @autometa/app@0.1.4
  - @autometa/jest-executor@0.1.5
  - @autometa/test-builder@0.1.5
  - @autometa/config@0.1.4

## 0.1.4

### Patch Changes

- e243e8b4: fix: globally scoped hooks not executing
- Updated dependencies [e243e8b4]
  - @autometa/jest-executor@0.1.4
  - @autometa/test-builder@0.1.4
  - @autometa/scopes@0.2.4
  - @autometa/gherkin@0.4.2
  - @autometa/events@0.1.2

## 0.1.3

### Patch Changes

- @autometa/app@0.1.3
- @autometa/scopes@0.2.3
- @autometa/test-builder@0.1.3
- @autometa/config@0.1.3
- @autometa/jest-executor@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies [e8f02f3a]
  - @autometa/gherkin@0.4.1
  - @autometa/errors@0.1.1
  - @autometa/scopes@0.2.2
  - @autometa/app@0.1.2
  - @autometa/events@0.1.1
  - @autometa/jest-executor@0.1.2
  - @autometa/test-builder@0.1.2
  - @autometa/asserters@0.1.1
  - @autometa/config@0.1.2

## 0.1.1

### Patch Changes

- @autometa/app@0.1.1
- @autometa/scopes@0.2.1
- @autometa/test-builder@0.1.1
- @autometa/config@0.1.1
- @autometa/jest-executor@0.1.1

## 0.1.0

### Minor Changes

- 554b77e: Releasing packages

### Patch Changes

- Updated dependencies [554b77e]
  - @autometa/app@0.1.0
  - @autometa/asserters@0.1.0
  - @autometa/config@0.1.0
  - @autometa/errors@0.1.0
  - @autometa/events@0.1.0
  - @autometa/gherkin@0.4.0
  - @autometa/jest-executor@0.1.0
  - @autometa/scopes@0.2.0
  - @autometa/test-builder@0.1.0
  - @autometa/types@0.4.0
