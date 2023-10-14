# @autometa/jest-executor

## 0.2.5

### Patch Changes

- Updated dependencies [329c6b8]
  - @autometa/gherkin@0.5.0
  - @autometa/scopes@0.3.0
  - @autometa/events@0.2.3
  - @autometa/test-builder@0.1.22

## 0.2.4

### Patch Changes

- Release Bump
- Updated dependencies
  - @autometa/test-builder@0.1.21
  - @autometa/config@0.1.11
  - @autometa/scopes@0.2.20
  - @autometa/app@0.1.11

## 0.2.3

### Patch Changes

- 85050386: Fix: missing trim and kebab case string mutations in phrases
  - @autometa/app@0.1.10
  - @autometa/scopes@0.2.19
  - @autometa/test-builder@0.1.20
  - @autometa/config@0.1.10

## 0.2.2

### Patch Changes

- fix: exporting event types
- Updated dependencies
  - @autometa/test-builder@0.1.19
  - @autometa/events@0.2.2
  - @autometa/scopes@0.2.18

## 0.2.1

### Patch Changes

- Updated dependencies [3672161c]
  - @autometa/events@0.2.1
  - @autometa/scopes@0.2.17
  - @autometa/test-builder@0.1.18

## 0.2.0

### Minor Changes

- 51d88780: Feat: Add Async Test Event support to new runner

### Patch Changes

- Updated dependencies [51d88780]
  - @autometa/events@0.2.0
  - @autometa/scopes@0.2.16
  - @autometa/test-builder@0.1.17

## 0.1.16

### Patch Changes

- 5b44aa88: Fix: miscalculated Levenshtein distance when comparing a gherkin step literal to a cucumber expression with a string expression
- Updated dependencies [5b44aa88]
  - @autometa/scopes@0.2.15
  - @autometa/test-builder@0.1.16

## 0.1.15

### Patch Changes

- 4af1139a: Fix: fuzzy search for step names prints malformed strings
- Updated dependencies [4af1139a]
  - @autometa/scopes@0.2.14
  - @autometa/test-builder@0.1.15

## 0.1.14

### Patch Changes

- Updated dependencies [4bbb87e4]
  - @autometa/scopes@0.2.13
  - @autometa/test-builder@0.1.14

## 0.1.13

### Patch Changes

- ddbdb401: Fix: World object not resolving correctly with DI
- Updated dependencies [ddbdb401]
  - @autometa/app@0.1.9
  - @autometa/scopes@0.2.12
  - @autometa/test-builder@0.1.13
  - @autometa/config@0.1.9

## 0.1.12

### Patch Changes

- Updated dependencies [2cbc095e]
  - @autometa/test-builder@0.1.12

## 0.1.11

### Patch Changes

- 53f958e1: Fix: steps not executing onStepEnded event when an error was thrown
- Updated dependencies [53f958e1]
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
  - @autometa/test-builder@0.1.10
  - @autometa/config@0.1.7
  - @autometa/scopes@0.2.10
  - @autometa/app@0.1.7

## 0.1.9

### Patch Changes

- Updated dependencies [f167963f]
  - @autometa/app@0.1.6
  - @autometa/scopes@0.2.9
  - @autometa/test-builder@0.1.9
  - @autometa/config@0.1.6

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
  - @autometa/test-builder@0.1.8

## 0.1.7

### Patch Changes

- ff45dc43: fix(jest-executor): step text was not correctly logged
- Updated dependencies [ff45dc43]
  - @autometa/events@0.1.4
  - @autometa/scopes@0.2.7
  - @autometa/test-builder@0.1.7

## 0.1.6

### Patch Changes

- 29ed7239: fix(test-builder): onStepStart event not firing
- Updated dependencies [29ed7239]
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
  - @autometa/test-builder@0.1.5
  - @autometa/config@0.1.4

## 0.1.4

### Patch Changes

- e243e8b4: fix: globally scoped hooks not executing
- Updated dependencies [e243e8b4]
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

## 0.1.2

### Patch Changes

- Updated dependencies [e8f02f3a]
  - @autometa/gherkin@0.4.1
  - @autometa/errors@0.1.1
  - @autometa/scopes@0.2.2
  - @autometa/app@0.1.2
  - @autometa/events@0.1.1
  - @autometa/test-builder@0.1.2
  - @autometa/asserters@0.1.1
  - @autometa/config@0.1.2

## 0.1.1

### Patch Changes

- @autometa/app@0.1.1
- @autometa/scopes@0.2.1
- @autometa/test-builder@0.1.1
- @autometa/config@0.1.1

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
  - @autometa/scopes@0.2.0
  - @autometa/test-builder@0.1.0
  - @autometa/types@0.4.0
