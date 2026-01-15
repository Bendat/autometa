---
"@autometa/core": minor
"@autometa/errors": patch
"@autometa/injection": patch
"@autometa/executor": patch
---

Introduce the unified umbrella package `@autometa/core` that re-exports user-facing APIs and exposes the `autometa` CLI. Migrate example projects to use `@autometa/core` subpaths to simplify installation and imports.

Internal fixes:
- Remove TypeScript `declare` fields in `@autometa/injection` and `@autometa/errors` to improve compatibility with certain transpilers.
- Convert several `@autometa/executor` re-exports to type-only to avoid runtime export issues under various transforms.

Example improvements:
- Playwright example now uses ESNext/Bundler module resolution and exports a fully-typed `ensure` facade with domain plugins (response/json/recipes/order/runtime) to fix `ensure.response` typing.
- Parameter types updated to avoid `unknown` on region expectations.

No breaking API changes to existing packages, but consumers are encouraged to adopt `@autometa/core` for a simpler DX.