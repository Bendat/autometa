# @autometa/cucumber-runner

## 0.7.4

### Patch Changes

- Updated dependencies [b3edef2]
  - @autometa/dto-builder@0.9.3

## 0.7.3

### Patch Changes

- 6a4a9ac: Swapped project type to "composite", unified build system for most projects
- Updated dependencies [6a4a9ac]
  - @autometa/dto-builder@0.9.2

## 0.7.2

### Patch Changes

- 2544062: Bugfix: scope was logging a boolean value which has been removed

## 0.7.1

### Patch Changes

- 174a507: Fixed pathing issue for global steps on windows

## 0.7.0

### Minor Changes

- 1ab33ca: Temporary hack fix fo bad filepaths on windows

## 0.6.0

### Minor Changes

- b48f577: Added initial implemention of scopes and updated `overloads`

### Patch Changes

- @autometa/dto-builder@0.9.1

## 0.5.6

### Patch Changes

- Updated dependencies [a874510]
  - @autometa/dto-builder@0.9.0

## 0.5.5

### Patch Changes

- 64bacd4: added 'tryGet' to datatables

## 0.5.4

### Patch Changes

- 2b0a616: Added tag filters to Before and After hook

## 0.5.3

### Patch Changes

- Updated dependencies [064b589]
  - @autometa/dto-builder@0.8.0

## 0.5.2

### Patch Changes

- c854f19: Setup and Teardow hooks now carry a global object

## 0.5.1

### Patch Changes

- Updated dependencies [cfc35f4]
  - @autometa/dto-builder@0.7.1

## 0.5.0

### Minor Changes

- 0a27508: Created "gherkin" package to help split up cucumber-runner

### Patch Changes

- Updated dependencies [0a27508]
  - @autometa/dto-builder@0.7.0

## 0.4.0

### Minor Changes

- 83bd517: Created "gherkin" package to help split up cucumber-runner

### Patch Changes

- Updated dependencies [83bd517]
  - @autometa/dto-builder@0.6.0

## 0.3.11

### Patch Changes

- 58678de: Fixed an incorrect description in cucumber-runner 'package.json'

## 0.3.10

### Patch Changes

- 1b6e728: Added 'confirm' type function. Small fix in markdown rendering

## 0.3.9

### Patch Changes

- d1c6132: Fixed a bug where hooks are not executed inside Rules or Outlines

## 0.3.8

### Patch Changes

- 90450d9: Fixed bug where steps don't use alternatable datatable constructors

## 0.3.7

### Patch Changes

- 5ad2e12: Fix Glob pattern for test generator

## 0.3.6

### Patch Changes

- b18ac45: Another fix for binaries

## 0.3.5

### Patch Changes

- 0039747: Fixed wrong path for bin files

## 0.3.4

### Patch Changes

- 8ce46c5: Added code generator for runner

## 0.3.3

### Patch Changes

- 2d58b0c: Fixed a bug where an undefined subscriber was applied to a scenario

## 0.3.2

### Patch Changes

- 20584c5: Fixed a bug which caused an error to be thrown if no subscriber fixtures were found

## 0.3.1

### Patch Changes

- 189b878: Removed console log from test execution

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
