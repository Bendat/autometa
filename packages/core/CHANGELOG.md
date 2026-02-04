# @autometa/core

## 1.0.0-rc.4

### Patch Changes

- e5c286b0: Add configurable directory-based scoping for hoisted feature files (while keeping `@scope(...)` as an override), and improve runner filtering behaviour when using native Vitest.
- Updated dependencies [e5c286b0]
  - @autometa/cli@1.0.0-rc.6
  - @autometa/config@1.0.0-rc.3
  - @autometa/executor@1.0.0-rc.4
  - @autometa/runner@1.0.0-rc.4
  - @autometa/assertions@1.0.0-rc.4
  - @autometa/http@2.0.0-rc.4

## 1.0.0-rc.3

### Patch Changes

- @autometa/executor@1.0.0-rc.3
- @autometa/assertions@1.0.0-rc.3
- @autometa/cli@1.0.0-rc.5
- @autometa/runner@1.0.0-rc.3
- @autometa/http@2.0.0-rc.3

## 1.0.0-rc.2

### Minor Changes

- 194871e0: Introduce the unified umbrella package `@autometa/core` that re-exports user-facing APIs and exposes the `autometa` CLI. Migrate example projects to use `@autometa/core` subpaths to simplify installation and imports.

  Internal fixes:

  - Remove TypeScript `declare` fields in `@autometa/injection` and `@autometa/errors` to improve compatibility with certain transpilers.
  - Convert several `@autometa/executor` re-exports to type-only to avoid runtime export issues under various transforms.

  Example improvements:

  - Playwright example now uses ESNext/Bundler module resolution and exports a fully-typed `ensure` facade with domain plugins (response/json/recipes/order/runtime) to fix `ensure.response` typing.
  - Parameter types updated to avoid `unknown` on region expectations.

  No breaking API changes to existing packages, but consumers are encouraged to adopt `@autometa/core` for a simpler DX.

### Patch Changes

- Updated dependencies [680641ec]
- Updated dependencies [1a0eebfa]
- Updated dependencies [1bd3dbe5]
- Updated dependencies [194871e0]
- Updated dependencies [14eebacf]
- Updated dependencies [1bd3dbe5]
  - @autometa/runner@1.0.0-rc.2
  - @autometa/cli@1.0.0-rc.4
  - @autometa/http@2.0.0-rc.2
  - @autometa/errors@1.0.0-rc.2
  - @autometa/injection@1.0.0-rc.2
  - @autometa/executor@1.0.0-rc.2
  - @autometa/gherkin@1.0.0-rc.2
  - @autometa/config@1.0.0-rc.2
  - @autometa/cucumber-expressions@1.0.0-rc.2
  - @autometa/datetime@1.0.0-rc.2
  - @autometa/assertions@1.0.0-rc.2
  - @autometa/dto-builder@1.0.0-rc.2
  - @autometa/phrases@1.0.0-rc.2
