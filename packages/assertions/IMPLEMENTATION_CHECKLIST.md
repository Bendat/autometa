# @autometa/assertions Implementation Checklist

> Entry verb: `ensure(value)` returning a fluent matcher chain that supports TypeScript narrowing and runner-agnostic assertions.
>
> Update this document as items are designed, implemented, or descoped.

## 1. API Surface & Architecture

- [x] Finalize module shape (`import { ensure } from "@autometa/assertions"`) and decide on secondary exports (e.g. `ensureSoft`, `createAssertionContext`).
- [x] Define the matcher chain interface (`AssertionChain<T>`) including chaining rules and error propagation semantics.
- [x] Specify how `this` / context is managed internally (class vs. closure vs. proxy) to keep tree-shakable, bind-safe matchers.
- [ ] Document alias strategy for mixed ecosystems (e.g. Playwright) and export any optional aliases (`expect` re-export, namespace import).

## 2. Type Safety & Narrowing

- [ ] Create TypeScript helper types for type assertions (e.g. `NonNullish<T>`) and chain narrowing (`AssertionChain<Narrowed>`).
- [ ] Ensure matchers like `toBeDefined`, `toBeInstanceOf`, `toSatisfy` use `asserts` to narrow both the chain and the caller variable.
- [x] Provide a mechanism to retrieve the narrowed value (`ensure(value).toBeDefined().value`) without breaking inference.
- [x] Add strict TS tests (dtslint / expect-type) covering narrowing behavior and misuse diagnostics.

## 3. Core Matcher Set

- [x] **Existence & Identity**: `toBe`, `toEqual`, `toStrictEqual`, `toBeDefined`, `toBeUndefined`, `toBeNull`, `toBeTruthy`, `toBeFalsy`.
- [ ] **Numbers & BigInts**: `toBeGreaterThan`, `toBeCloseTo`, `toBeWithin`, handling precision and NaN.
- [ ] **Strings & Patterns**: `toMatch`, `toContain`, case-insensitive / regex support.
- [x] **Collections**: `toHaveLength`, `toContainEqual`, `toBeIterableContaining`, `toBeObjectContaining` with partial deep matches (`toBeArrayContaining` ✅).
- [ ] **Objects & Records**: structural comparison, key presence assertions, optional strict mode toggles.
- [ ] **Errors & Functions**: `toThrow`, `toThrowErrorMatching`, async error checks.
- [ ] **Promises/Async**: `resolves`, `rejects`, `toResolveWith`, integrate with async workflows.
- [ ] **Custom predicates**: `toSatisfy(predicate)` returning a narrowed type if predicate is a type guard.

## 4. Advanced Features (Stretch Goals)

- [ ] Soft assertions / aggregation: `ensure.soft(value)` to collect failures without throwing immediately.
- [ ] Polling / eventual matchers for async conditions (`ensure.poll(value).toEventually...`).
- [ ] Snapshot / shape assertions (consider reusing existing infrastructure or delegating to CLI).
- [ ] Plugin system for registering custom matchers with type inference support.
- [ ] Runtime configuration hooks (custom diff formatters, precision defaults, localization of messages).

## 5. Error Messaging & Diagnostics

- [ ] Design error object shape (message, matcher, expected/actual, diff metadata).
- [ ] Implement rich diff support for objects/arrays/primitives.
- [ ] Provide matcher hints ("Received", "Expected") consistent with Autometa CLI output.
- [ ] Integrate stack pruning to surface user code first while preserving debuggability.

## 6. Formatting & Utility Libraries

- [ ] Evaluate `pretty-format` (Jest) or alternatives (e.g. `util.inspect`, `kleur`) for rendering values.
- [ ] Evaluate `jest-diff` or `@autometa/diff?` for deep diffs; consider `diff-sequences` or `fast-json-stable-stringify` for stability.
- [ ] Evaluate `fast-deep-equal` / `dequal` for performant deep equality checks.
- [ ] Decide on optional dependency strategy vs. vendoring to keep bundle size manageable.
- [ ] Establish color/terminal abstraction consistent with Autometa runner (maybe reuse existing logger utilities).

## 7. Internal Infrastructure

- [ ] Implement lightweight assertion engine (context object + matcher registry) with minimal overhead.
- [ ] Add matcher registration API for internal packages (`registerMatcher(name, factory)`), retaining type safety.
- [ ] Ensure tree-shaking works with tsup configuration; verify ESM/CJS parity.
- [ ] Hook up linting, formatting, and test tooling (Vitest + coverage) to match repo standards.
- [ ] Add benchmark scaffolding to watch for performance regressions (may reuse `tinybench`).

## 8. Integration Points

- [ ] Update CLI/runtime packages to consume `ensure` instead of bespoke helpers once stable.
- [ ] Provide example usage (e.g. `examples/vitest-functions`) demonstrating migration from runner-specific expects.
- [ ] Confirm compatibility with Autometa runner error pipeline and output formatting.
- [ ] Consider adapter helpers for blending with third-party expect APIs (`extendPlaywrightExpect`?).

## 9. Documentation & Examples

- [ ] Flesh out `packages/assertions/README.md` with usage, type narrowing examples, and migration guidance.
- [ ] Generate API reference (typedoc or hand-written) once surface stabilizes.
- [ ] Create cookbook examples for common patterns (domain object checks, async workflows, soft assertions).
- [ ] Document interoperability with Playwright/Jest/Vitest (aliasing, mixed usage patterns).

## 10. Release & Maintenance

- [ ] Define versioning strategy (semver, pre-release tags) and align with monorepo publishing.
- [ ] Add changelog entry template for new matchers / breaking changes.
- [ ] Create regression test suite ensuring legacy behavior if we replace existing helper functions.
- [ ] Plan migration steps for downstream packages (search/replace neutral helpers -> `ensure`).

---

### Candidate Libraries to Consider

| Capability | Libraries | Notes |
| --- | --- | --- |
| Value pretty-print / diff | `pretty-format`, `jest-diff`, `diff-sequences` | Mature ecosystem, good Unicode support, but adds deps; can tree-shake if modularized. |
| Deep equality | `fast-deep-equal`, `dequal`, `lodash.isEqual` | `fast-deep-equal` is tiny & performant; lacks metadata for diffs. |
| Type guards / predicates | `ts-toolbelt`, `type-fest` | Provides utility types that could reduce boilerplate; weigh dependency cost. |
| Assertion message styling | `kleur`, `chalk`, `colorette` | Evaluate consistency with Autometa CLI coloring strategy. |
| Benchmarking | `tinybench`, `benchmark` | Useful for measuring matcher performance if needed. |

Update the checklist as features land or get deferred.
