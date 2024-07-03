# @autometa/documentation

## 0.10.0

### Minor Changes

- 884c9dd: Add support to access App instance from cucumber expression transformer

## 0.9.0

### Minor Changes

- dfd1f81: feat: support arrays and nested objects in file object proxy

## 0.8.0

### Minor Changes

- 7e9d2bc: feat: Table Documents

  Introduces a new way of handling tables which are horizontal (HTable) or vertical (VTable) which maps
  the headers of a table to an object properties, defined using a class.

  [docs](https://bendat.github.io/autometa/docs/cucumber/test_runner/datatables#table-documents)

## 0.7.0

### Minor Changes

- d563916: feat: replace 'reflect-metadata' with custom solution
- 82168a2: fix: `onRecievedResponse` hook not running when response failed schema validation

  - Renamed hooks to `onSend` and `onRecieve`
  - Rewrote HTTP fixture logic to be constructable and derivable.
    - `new HTTP().sharedRoute('v1')` constructs a single instance of HTTP with route `v1`
    - `new HTTP().sharedRoute('v1').route('user') derives a new HTTP fixture which inherits 'v1' and adds 'user' locally.
  - Support for list based params with `paramList` and `sharedParamList`
  - Added default schemas for use with simple response types like null, boolean, number etc

## 0.6.0

### Minor Changes

- 98d911f: feat: replace tsyringe with custom DI solution

## 0.5.3

### Patch Changes

- 04ed85d: feat: added HTP client based on axios

## 0.5.2

### Patch Changes

- e243e8b4: fix: globally scoped hooks not executing

## 0.5.1

### Patch Changes

- 531b421: Fix for runner not publishing to NPM

## 0.5.0

### Minor Changes

- 554b77e: Releasing packages

## 0.4.3

### Patch Changes

- 6a4a9ac: Swapped project type to "composite", unified build system for most projects

## 0.4.2

### Patch Changes

- f7c581f: Fixed typo in docs

## 0.4.1

### Patch Changes

- f892a6b: Builders can now construct DTOs from raw objects

## 0.4.0

### Minor Changes

- bb7d90b: Added support for default values and nested DTO types

## 0.3.0

### Minor Changes

- 754baeb: Added Allure Report integration

  Backgrounds now work

## 0.2.0

### Minor Changes

- 4049400: Added 'Subscribers' to listen to test events

## 0.1.1

### Patch Changes

- 578823f: Fixed issue with missing readmes

## 0.1.0

### Minor Changes

- c514b41: Added cucumber runner, markdown parser, dto builder
