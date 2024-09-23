# @autometa/dto-builder

## 0.13.10

### Patch Changes

- Updated dependencies [da669a3]
  - @autometa/injection@0.1.4

## 0.13.9

### Patch Changes

- 603d0d0: fix(dto-builder): default values where being cached within the builder

## 0.13.8

### Patch Changes

- Updated dependencies [2aee2a4]
  - @autometa/injection@0.1.3

## 0.13.7

### Patch Changes

- 536004e: fix: injection errors and http client hooks

  - The new dependency injection library sometimes returned class prototypes instead of class instances due to inconsistent caching of decorated types.
  - HTTP client hooks were not executing when certain builder methods were called.

- Updated dependencies [536004e]
  - @autometa/injection@0.1.2

## 0.13.6

### Patch Changes

- cccedea: fix(http): dynamic headers not deriving and resolving correctly

## 0.13.5

### Patch Changes

- db87a56: fix(dto-builder): expose 'ClsBuilder' type

## 0.13.4

### Patch Changes

- ae7e34f: fix(dto-builder): allow custom properties and symbols on builders

## 0.13.3

### Patch Changes

- manual release

## 0.13.2

### Patch Changes

- manually releasing new version

## 0.13.1

### Patch Changes

- 95512a3: fix(dto-builder): default dto properties are not enumerable

## 0.13.0

### Minor Changes

- 7e9d2bc: feat: Table Documents

  Introduces a new way of handling tables which are horizontal (HTable) or vertical (VTable) which maps
  the headers of a table to an object properties, defined using a class.

  [docs](https://bendat.github.io/autometa/docs/cucumber/test_runner/datatables#table-documents)

## 0.12.0

### Minor Changes

- d563916: feat: replace 'reflect-metadata' with custom solution

### Patch Changes

- Updated dependencies [d563916]
  - @autometa/injection@0.1.1

## 0.11.1

### Patch Changes

- 4f7d4d0: fix: class-validator dependency missing

## 0.11.0

### Minor Changes

- 8f116d9: feat: access tracker and error catching proxies on fixtures

## 0.10.1

### Patch Changes

- 04ed85d: feat: added HTP client based on axios

## 0.10.0

### Minor Changes

- 554b77e: Releasing packages

## 0.9.4

### Patch Changes

- 8ad0f1f: Feature: 'append" method, similar to "assign" but works with array values

## 0.9.3

### Patch Changes

- b3edef2: Fix: class-validator should be an optional dependency

## 0.9.2

### Patch Changes

- 6a4a9ac: Swapped project type to "composite", unified build system for most projects
- Updated dependencies [6a4a9ac]
  - @autometa/types@0.3.1

## 0.9.1

### Patch Changes

- Updated dependencies [b48f577]
  - @autometa/types@0.3.0

## 0.9.0

### Minor Changes

- a874510: Builder methods can now retrieve the underlying value with the `.value` property

## 0.8.0

### Minor Changes

- 064b589: Added an "assign" method for to assign properties from dynaic strings

## 0.7.1

### Patch Changes

- cfc35f4: Update build systems on packages to use tsup
- Updated dependencies [cfc35f4]
  - @autometa/types@0.2.1

## 0.7.0

### Minor Changes

- 0a27508: Created "gherkin" package to help split up cucumber-runner

### Patch Changes

- Updated dependencies [0a27508]
  - @autometa/types@0.2.0

## 0.6.0

### Minor Changes

- 83bd517: Created "gherkin" package to help split up cucumber-runner

## 0.5.5

### Patch Changes

- 4fdd04a: Removed call to vitest and commented out code

## 0.5.4

### Patch Changes

- 113d6cd: Readme fix

## 0.5.3

### Patch Changes

- 8ce46c5: Added code generator for runner

## 0.5.2

### Patch Changes

- 621ec9a: Added 'status-code' library

## 0.5.1

### Patch Changes

- 0ec20e7: Properties with no default value will no longer be assigned as undefined, and will the keys will not exist on the dto class object

- f7c581f: Fixed typo in docs

## 0.5.0

### Minor Changes

- f892a6b: Builders can now construct DTOs from raw objects

## 0.4.0

### Minor Changes

- bb7d90b: Added support for default values and nested DTO types

## 0.3.0

### Minor Changes

- 754baeb: Added Allure Report integration

  Backgrounds now work

## 0.2.1

### Patch Changes

- 914a820: Updated readme.md

## 0.2.0

### Minor Changes

- 4049400: Added 'Subscribers' to listen to test events

## 0.1.1

### Patch Changes

- 578823f: Fixed issue with missing readmes

## 0.1.0

### Minor Changes

- c514b41: Added cucumber runner, markdown parser, dto builder
