# Gherkin

## 0.4.0

### Minor Changes

- de6dad7: Feat: Expressions are now loaded using config

## 0.3.6

### Patch Changes

- Updated dependencies [020b205]
  - @autometa/cucumber-expressions@0.3.5

## 0.3.5

### Patch Changes

- Updated dependencies [bc3d616]
  - @autometa/cucumber-expressions@0.3.4

## 0.3.4

### Patch Changes

- Updated dependencies [f8b311e]
  - @autometa/cucumber-expressions@0.3.3

## 0.3.3

### Patch Changes

- @autometa/cucumber-expressions@0.3.2

## 0.3.2

### Patch Changes

- Updated dependencies [4b796f8]
  - @autometa/gherkin@0.5.1
  - @autometa/events@0.2.4

## 0.3.1

### Patch Changes

- 4ee4e99: Fixes strings like 'abc2bd' being parsed as NaN in `primitive` expression type. Not supports comma and decimal delimters (EU, US respectively
- Updated dependencies [4ee4e99]
  - @autometa/cucumber-expressions@0.3.1
  - @autometa/app@0.1.12

## 0.3.0

### Minor Changes

- 329c6b8: Fix: asJson missing from new tables, 'missing' missing from primitive regex's

### Patch Changes

- Updated dependencies [329c6b8]
  - @autometa/cucumber-expressions@0.3.0
  - @autometa/gherkin@0.5.0
  - @autometa/events@0.2.3

## 0.2.20

### Patch Changes

- Release Bump
- Updated dependencies
  - @autometa/cucumber-expressions@0.2.2
  - @autometa/phrases@0.1.7
  - @autometa/app@0.1.11

## 0.2.19

### Patch Changes

- Updated dependencies [85050386]
  - @autometa/phrases@0.1.6
  - @autometa/app@0.1.10
  - @autometa/cucumber-expressions@0.2.1

## 0.2.18

### Patch Changes

- fix: exporting event types
- Updated dependencies
  - @autometa/events@0.2.2

## 0.2.17

### Patch Changes

- Updated dependencies [3672161c]
  - @autometa/events@0.2.1

## 0.2.16

### Patch Changes

- Updated dependencies [51d88780]
  - @autometa/cucumber-expressions@0.2.0
  - @autometa/events@0.2.0

## 0.2.15

### Patch Changes

- 5b44aa88: Fix: miscalculated Levenshtein distance when comparing a gherkin step literal to a cucumber expression with a string expression
- Updated dependencies [5b44aa88]
  - @autometa/cucumber-expressions@0.1.10

## 0.2.14

### Patch Changes

- 4af1139a: Fix: fuzzy search for step names prints malformed strings
- Updated dependencies [4af1139a]
  - @autometa/cucumber-expressions@0.1.9

## 0.2.13

### Patch Changes

- 4bbb87e4: Fix: step search returns literal strings instead of expressions when no exact match is found
- Updated dependencies [4bbb87e4]
  - @autometa/cucumber-expressions@0.1.8

## 0.2.12

### Patch Changes

- ddbdb401: Fix: World object not resolving correctly with DI
- Updated dependencies [ddbdb401]
  - @autometa/app@0.1.9

## 0.2.11

### Patch Changes

- 53f958e1: Fix: steps not executing onStepEnded event when an error was thrown
- Updated dependencies [53f958e1]
  - @autometa/app@0.1.8
  - @autometa/errors@0.1.3
  - @autometa/events@0.1.6
  - @autometa/gherkin@0.4.5
  - @autometa/phrases@0.1.5
  - @autometa/types@0.4.1

## 0.2.10

### Patch Changes

- Fix: bad dist published
- Updated dependencies
  - @autometa/app@0.1.7

## 0.2.9

### Patch Changes

- f167963f: Fix: typo in AutometaWorld 'dfromPhrase' -> 'fromPhrase'
- Updated dependencies [f167963f]
  - @autometa/app@0.1.6

## 0.2.8

### Patch Changes

- 12bd4b1e: fix: hooks not handling errors correctly
- Updated dependencies [12bd4b1e]
  - @autometa/errors@0.1.2
  - @autometa/app@0.1.5
  - @autometa/events@0.1.5
  - @autometa/gherkin@0.4.4
  - @autometa/phrases@0.1.4

## 0.2.7

### Patch Changes

- Updated dependencies [ff45dc43]
  - @autometa/events@0.1.4

## 0.2.6

### Patch Changes

- Updated dependencies [29ed7239]
  - @autometa/gherkin@0.4.3
  - @autometa/events@0.1.3

## 0.2.5

### Patch Changes

- 4a16497d: fix(scopes): hooks not executing without tag expressions
- Updated dependencies [4a16497d]
  - @autometa/app@0.1.4

## 0.2.4

### Patch Changes

- e243e8b4: fix: globally scoped hooks not executing
- Updated dependencies [e243e8b4]
  - @autometa/overloaded@0.3.1
  - @autometa/gherkin@0.4.2
  - @autometa/events@0.1.2

## 0.2.3

### Patch Changes

- Updated dependencies [0cc7f6aa]
  - @autometa/phrases@0.1.3
  - @autometa/app@0.1.3

## 0.2.2

### Patch Changes

- e8f02f3a: Small bug fixes, unit test coverage, tag expressions
- Updated dependencies [e8f02f3a]
  - @autometa/gherkin@0.4.1
  - @autometa/phrases@0.1.2
  - @autometa/errors@0.1.1
  - @autometa/app@0.1.2
  - @autometa/events@0.1.1

## 0.2.1

### Patch Changes

- Updated dependencies [bf23fc4]
  - @autometa/phrases@0.1.1
  - @autometa/app@0.1.1

## 0.2.0

### Minor Changes

- 554b77e: Releasing packages

### Patch Changes

- Updated dependencies [554b77e]
  - @autometa/bind-decorator@0.5.0
  - @autometa/dto-builder@0.10.0
  - @autometa/overloaded@0.3.0
  - @autometa/app@0.1.0
  - @autometa/errors@0.1.0
  - @autometa/events@0.1.0
  - @autometa/gherkin@0.4.0
  - @autometa/phrases@0.1.0
  - @autometa/types@0.4.0

## 0.1.10

### Patch Changes

- Updated dependencies [06785c2]
- Updated dependencies [8ad0f1f]
  - @autometa/overloaded@0.2.9
  - @autometa/dto-builder@0.9.4
  - @autometa/gherkin@0.3.3
  - @autometa/events@0.0.10

## 0.1.9

### Patch Changes

- Updated dependencies [b3edef2]
  - @autometa/dto-builder@0.9.3
  - @autometa/gherkin@0.3.2
  - @autometa/events@0.0.9

## 0.1.8

### Patch Changes

- Updated dependencies [42badf4]
  - @autometa/overloaded@0.2.8

## 0.1.7

### Patch Changes

- Updated dependencies [adeb833]
  - @autometa/overloaded@0.2.7

## 0.1.6

### Patch Changes

- 6a4a9ac: Swapped project type to "composite", unified build system for most projects
- Updated dependencies [6a4a9ac]
  - @autometa/bind-decorator@0.4.1
  - @autometa/dto-builder@0.9.2
  - @autometa/overloaded@0.2.6
  - @autometa/events@0.0.8
  - @autometa/gherkin@0.3.1
  - @autometa/types@0.3.1

## 0.1.5

### Patch Changes

- Updated dependencies [61f6294]
- Updated dependencies [61f6294]
- Updated dependencies [61f6294]
- Updated dependencies [61f6294]
  - @autometa/overloaded@0.2.5

## 0.1.4

### Patch Changes

- Updated dependencies [83cc218]
- Updated dependencies [83cc218]
- Updated dependencies [83cc218]
  - @autometa/overloaded@0.2.4

## 0.1.3

### Patch Changes

- Updated dependencies [6915447]
- Updated dependencies [6915447]
  - @autometa/overloaded@0.2.3

## 0.1.2

### Patch Changes

- Updated dependencies [0bb7108]
  - @autometa/overloaded@0.2.2

## 0.1.1

### Patch Changes

- Updated dependencies [939bc8f]
  - @autometa/overloaded@0.2.1

## 0.1.0

### Minor Changes

- b48f577: Added initial implemention of scopes and updated `overloads`

### Patch Changes

- Updated dependencies [b48f577]
- Updated dependencies [b48f577]
- Updated dependencies [b48f577]
  - @autometa/overloaded@0.2.0
  - @autometa/bind-decorator@0.4.0
  - @autometa/gherkin@0.3.0
  - @autometa/types@0.3.0
  - @autometa/events@0.0.7
  - @autometa/dto-builder@0.9.1

## 0.2.1

### Patch Changes

- cfc35f4: Update build systems on packages to use tsup
- Updated dependencies [cfc35f4]
  - @autometa/dto-builder@0.7.1
  - @autometa/types@0.2.1
