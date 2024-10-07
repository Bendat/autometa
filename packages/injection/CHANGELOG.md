# @autometa/injection

## 0.1.5

### Patch Changes

- 8df323c: feat: tag filters for disposer methods

## 0.1.4

### Patch Changes

- da669a3: feat: disposable injectables

## 0.1.3

### Patch Changes

- 2aee2a4: fix(http): spread and array parameters not passed correctly

## 0.1.2

### Patch Changes

- 536004e: fix: injection errors and http client hooks

  - The new dependency injection library sometimes returned class prototypes instead of class instances due to inconsistent caching of decorated types.
  - HTTP client hooks were not executing when certain builder methods were called.

## 0.1.1

### Patch Changes

- d563916: feat: replace 'reflect-metadata' with custom solution

## 0.1.0

### Minor Changes

- 98d911f: feat: replace tsyringe with custom DI solution
