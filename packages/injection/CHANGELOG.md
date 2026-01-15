# @autometa/injection

## 1.0.0-rc.2

### Patch Changes

- 194871e0: Introduce the unified umbrella package `@autometa/core` that re-exports user-facing APIs and exposes the `autometa` CLI. Migrate example projects to use `@autometa/core` subpaths to simplify installation and imports.

  Internal fixes:

  - Remove TypeScript `declare` fields in `@autometa/injection` and `@autometa/errors` to improve compatibility with certain transpilers.
  - Convert several `@autometa/executor` re-exports to type-only to avoid runtime export issues under various transforms.

  Example improvements:

  - Playwright example now uses ESNext/Bundler module resolution and exports a fully-typed `ensure` facade with domain plugins (response/json/recipes/order/runtime) to fix `ensure.response` typing.
  - Parameter types updated to avoid `unknown` on region expectations.

  No breaking API changes to existing packages, but consumers are encouraged to adopt `@autometa/core` for a simpler DX.

## 1.0.0-rc.1

### Patch Changes

- Roll prerelease tag to rc.1+ for the v1 rewrite packages (rc2 drop).

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
