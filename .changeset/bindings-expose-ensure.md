---
"@autometa/runner": minor
---

feat(runner): expose `ensure` on `runner.bindingsTS()` surface

- Add `ensure` to the bindings TS surface, delegating to `steps().ensure`.
- Enables convenient `const { Binding, Given, ensure } = runner.bindingsTS();` usage.
- Typed as `any` to avoid leaking builder facet generics through the bindings API while preserving runtime behavior.
