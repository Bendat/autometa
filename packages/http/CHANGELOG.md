# @autometa/http

## 1.4.20

### Patch Changes

- Updated dependencies [8df323c]
  - @autometa/injection@0.1.5
  - @autometa/dto-builder@0.13.11
  - @autometa/app@0.4.2

## 1.4.19

### Patch Changes

- Updated dependencies [da669a3]
  - @autometa/injection@0.1.4
  - @autometa/app@0.4.1
  - @autometa/dto-builder@0.13.10

## 1.4.18

### Patch Changes

- Updated dependencies [7440e9f]
  - @autometa/app@0.4.0

## 1.4.17

### Patch Changes

- Updated dependencies [1d3f84e]
  - @autometa/app@0.3.5

## 1.4.16

### Patch Changes

- f60af5c: fix(http): dynamic headers could not be replaced with static headers

## 1.4.15

### Patch Changes

- fdc17af: fix: params setter only accept string values

## 1.4.14

### Patch Changes

- d759d5c: fix: value.replace is not a function when allowPlainText is false

## 1.4.13

### Patch Changes

- Updated dependencies [603d0d0]
  - @autometa/dto-builder@0.13.9

## 1.4.12

### Patch Changes

- 0a250f4: regression

## 1.4.11

### Patch Changes

- b579743: fix(http): options not derived

## 1.4.10

### Patch Changes

- dbc0eda: feat(http): allow client options to be created with `sharedOptions`

## 1.4.9

### Patch Changes

- 2aee2a4: fix(http): spread and array parameters not passed correctly
- 2aee2a4: fix(http): spread and array parameters not passed correctly
- Updated dependencies [2aee2a4]
  - @autometa/injection@0.1.3
  - @autometa/dto-builder@0.13.8
  - @autometa/app@0.3.4

## 1.4.8

### Patch Changes

- 536004e: fix: injection errors and http client hooks

  - The new dependency injection library sometimes returned class prototypes instead of class instances due to inconsistent caching of decorated types.
  - HTTP client hooks were not executing when certain builder methods were called.

- Updated dependencies [536004e]
- Updated dependencies [bac2661]
  - @autometa/dto-builder@0.13.7
  - @autometa/injection@0.1.2
  - @autometa/app@0.3.3

## 1.4.7

### Patch Changes

- cccedea: fix(http): dynamic headers not deriving and resolving correctly
- Updated dependencies [cccedea]
  - @autometa/dto-builder@0.13.6

## 1.4.6

### Patch Changes

- Updated dependencies [db87a56]
  - @autometa/dto-builder@0.13.5

## 1.4.5

### Patch Changes

- Updated dependencies [ae7e34f]
  - @autometa/dto-builder@0.13.4

## 1.4.4

### Patch Changes

- Updated dependencies
  - @autometa/dto-builder@0.13.3

## 1.4.3

### Patch Changes

- Updated dependencies
  - @autometa/dto-builder@0.13.2

## 1.4.2

### Patch Changes

- Updated dependencies [95512a3]
  - @autometa/dto-builder@0.13.1

## 1.4.1

### Patch Changes

- 16634f7: fix(HTTP): dynamic headers not passable nor resolving

## 1.4.0

### Minor Changes

- 7e9d2bc: feat: Table Documents

  Introduces a new way of handling tables which are horizontal (HTable) or vertical (VTable) which maps
  the headers of a table to an object properties, defined using a class.

  [docs](https://bendat.github.io/autometa/docs/cucumber/test_runner/datatables#table-documents)

### Patch Changes

- Updated dependencies [7e9d2bc]
  - @autometa/dto-builder@0.13.0

## 1.3.0

### Minor Changes

- 82168a2: fix: `onRecievedResponse` hook not running when response failed schema validation

  - Renamed hooks to `onSend` and `onRecieve`
  - Rewrote HTTP fixture logic to be constructable and derivable.
    - `new HTTP().sharedRoute('v1')` constructs a single instance of HTTP with route `v1`
    - `new HTTP().sharedRoute('v1').route('user') derives a new HTTP fixture which inherits 'v1' and adds 'user' locally.
  - Support for list based params with `paramList` and `sharedParamList`
  - Added default schemas for use with simple response types like null, boolean, number etc

### Patch Changes

- Updated dependencies [d563916]
  - @autometa/dto-builder@0.12.0
  - @autometa/injection@0.1.1
  - @autometa/app@0.3.2

## 1.2.1

### Patch Changes

- Updated dependencies [6c4bb8d]
  - @autometa/app@0.3.1

## 1.2.0

### Minor Changes

- 98d911f: feat: replace tsyringe with custom DI solution

### Patch Changes

- Updated dependencies [98d911f]
  - @autometa/injection@0.1.0
  - @autometa/app@0.3.0

## 1.1.0

### Minor Changes

- 4bbe6fc: feat: support factory function for shared headers

## 1.0.14

### Patch Changes

- Updated dependencies [3fe2ad4]
  - @autometa/errors@0.2.2
  - @autometa/app@0.2.4

## 1.0.13

### Patch Changes

- Updated dependencies [3493bb6]
  - @autometa/errors@0.2.1
  - @autometa/app@0.2.3

## 1.0.12

### Patch Changes

- Updated dependencies [8ec0cdc]
  - @autometa/app@0.2.2

## 1.0.11

### Patch Changes

- @autometa/app@0.2.1

## 1.0.10

### Patch Changes

- Updated dependencies [b5ce008]
- Updated dependencies [8f116d9]
  - @autometa/errors@0.2.0
  - @autometa/app@0.2.0

## 1.0.9

### Patch Changes

- a7b715a: fix: return empty string bodies without allowPlainText

## 1.0.8

### Patch Changes

- 3390c77: fix: RequestState uses objects instead of maps

## 1.0.7

### Patch Changes

- b992a2b: fix: HTTPResponse should be exported

## 1.0.6

### Patch Changes

- 469f0cb: refactor: http client refactor

## 1.0.5

### Patch Changes

- 3a8b32f: fix: improper handling of strings when parsing

## 1.0.4

### Patch Changes

- 79a672d: fix: JSON.parse responses

## 1.0.3

### Patch Changes

- ef91448: fix: http client return undefined

## 1.0.2

### Patch Changes

- 9870641: fix: allow empty plaintext response without flagging it

## 1.0.1

### Patch Changes

- e9a8dc8: fix: parsing numbers from raw response string

## 1.0.0

### Major Changes

- c7b973f: fix: onRecieve hooks not executing if schema validation fails

## 0.1.2

### Patch Changes

- 815b324: Fix: incorrectly imported cli-highlight package

## 0.1.1

### Patch Changes

- 2ec3670: fix: http client accepts any input and converts it to a string

## 0.1.0

### Minor Changes

- 04ed85d: feat: added HTP client based on axios

### Patch Changes

- Updated dependencies [04ed85d]
  - @autometa/status-codes@0.4.1
  - @autometa/errors@0.1.4
  - @autometa/app@0.1.13
