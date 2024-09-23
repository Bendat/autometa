# @autometa/app

## 0.4.1

### Patch Changes

- da669a3: feat: disposable injectables
- Updated dependencies [da669a3]
  - @autometa/injection@0.1.4

## 0.4.0

### Minor Changes

- 7440e9f: feat: new group based hooks for feature, rule, outline and examples

## 0.3.5

### Patch Changes

- 1d3f84e: fix: getApp returned app without di container reference

## 0.3.4

### Patch Changes

- Updated dependencies [2aee2a4]
  - @autometa/injection@0.1.3

## 0.3.3

### Patch Changes

- 536004e: fix: injection errors and http client hooks

  - The new dependency injection library sometimes returned class prototypes instead of class instances due to inconsistent caching of decorated types.
  - HTTP client hooks were not executing when certain builder methods were called.

- bac2661: fix: world not defined on app
- Updated dependencies [536004e]
  - @autometa/injection@0.1.2

## 0.3.2

### Patch Changes

- Updated dependencies [d563916]
  - @autometa/injection@0.1.1

## 0.3.1

### Patch Changes

- 6c4bb8d: fix: getApp function not defined

## 0.3.0

### Minor Changes

- 98d911f: feat: replace tsyringe with custom DI solution

### Patch Changes

- Updated dependencies [98d911f]
  - @autometa/injection@0.1.0

## 0.2.4

### Patch Changes

- Updated dependencies [3fe2ad4]
  - @autometa/errors@0.2.2
  - @autometa/asserters@0.1.8
  - @autometa/fixture-proxies@0.1.3
  - @autometa/phrases@0.1.12

## 0.2.3

### Patch Changes

- Updated dependencies [3493bb6]
  - @autometa/errors@0.2.1
  - @autometa/asserters@0.1.7
  - @autometa/fixture-proxies@0.1.2
  - @autometa/phrases@0.1.11

## 0.2.2

### Patch Changes

- 8ec0cdc: fix: allow whitelist for tracked types, don't auto-track World
- Updated dependencies [8ec0cdc]
  - @autometa/fixture-proxies@0.1.1

## 0.2.1

### Patch Changes

- Updated dependencies [0c070cb]
  - @autometa/asserters@0.1.6
  - @autometa/phrases@0.1.10

## 0.2.0

### Minor Changes

- 8f116d9: feat: access tracker and error catching proxies on fixtures

### Patch Changes

- Updated dependencies [b5ce008]
- Updated dependencies [8f116d9]
  - @autometa/errors@0.2.0
  - @autometa/fixture-proxies@0.1.0
  - @autometa/asserters@0.1.5
  - @autometa/phrases@0.1.9

## 0.1.13

### Patch Changes

- 04ed85d: feat: added HTP client based on axios
- Updated dependencies [04ed85d]
  - @autometa/asserters@0.1.4
  - @autometa/phrases@0.1.8
  - @autometa/errors@0.1.4

## 0.1.12

### Patch Changes

- 4ee4e99: Fixes strings like 'abc2bd' being parsed as NaN in `primitive` expression type. Not supports comma and decimal delimters (EU, US respectively

## 0.1.11

### Patch Changes

- Release Bump
- Updated dependencies
  - @autometa/phrases@0.1.7

## 0.1.10

### Patch Changes

- Updated dependencies [85050386]
  - @autometa/phrases@0.1.6

## 0.1.9

### Patch Changes

- ddbdb401: Fix: World object not resolving correctly with DI

## 0.1.8

### Patch Changes

- 53f958e1: Fix: steps not executing onStepEnded event when an error was thrown
- Updated dependencies [53f958e1]
  - @autometa/asserters@0.1.3
  - @autometa/errors@0.1.3
  - @autometa/phrases@0.1.5

## 0.1.7

### Patch Changes

- Fix: bad dist published

## 0.1.6

### Patch Changes

- f167963f: Fix: typo in AutometaWorld 'dfromPhrase' -> 'fromPhrase'

## 0.1.5

### Patch Changes

- Updated dependencies [12bd4b1e]
  - @autometa/errors@0.1.2
  - @autometa/asserters@0.1.2
  - @autometa/phrases@0.1.4

## 0.1.4

### Patch Changes

- 4a16497d: fix(scopes): hooks not executing without tag expressions

## 0.1.3

### Patch Changes

- Updated dependencies [0cc7f6aa]
  - @autometa/phrases@0.1.3

## 0.1.2

### Patch Changes

- e8f02f3a: Small bug fixes, unit test coverage, tag expressions
- Updated dependencies [e8f02f3a]
  - @autometa/phrases@0.1.2
  - @autometa/errors@0.1.1
  - @autometa/asserters@0.1.1

## 0.1.1

### Patch Changes

- Updated dependencies [bf23fc4]
  - @autometa/phrases@0.1.1

## 0.1.0

### Minor Changes

- 554b77e: Releasing packages

### Patch Changes

- Updated dependencies [554b77e]
  - @autometa/asserters@0.1.0
  - @autometa/errors@0.1.0
  - @autometa/phrases@0.1.0
