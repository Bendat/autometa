# DTO Builder v1 Action Plan

## Phase 1 · Product Alignment
- [ ] Capture a concise vision statement covering interface-based and class-based usage.
- [ ] Finalize supported migration paths from legacy proxies to the new factories.
- [ ] List explicit non-goals to keep the scope focused for 1.0.

## Phase 2 · API & Type Surface
- [ ] Design the public `DtoBuilder.forInterface` and `DtoBuilder.forClass` signatures.
- [ ] Define the minimal builder instance API (`set`, `update`, `append`, `build`, `derive`).
- [ ] Prototype the typed property façade (e.g. `builder.props.foo.set(value)`) and confirm inference quality in editors.

## Phase 3 · Metadata & Schema Integration
- [ ] Specify the `SchemaAdapter` contract for plugging in decorators, Zod, class-validator, or bespoke schemas.
- [ ] Implement the decorator-backed adapter that consumes existing metadata, detached from `@autometa/injection`.
- [ ] Provide a lightweight manual schema adapter for environments without decorators.
- [ ] Document how third parties can implement custom adapters.

## Phase 4 · Builder State Architecture
- [ ] Implement an immutable builder state with copy-on-write semantics for `derive`.
- [ ] Introduce path-aware helpers (`updatePath`, `withPath`) for deep mutations without proxies.
- [ ] Ensure array/object operations (`append`, `merge`) are composable and type-safe.
- [ ] Add error handling for missing defaults, unknown paths, or invalid assignments.

## Phase 5 · Validation & Lifecycle Hooks
- [ ] Define the validation hook API (`validate(dto, context)`), including async support.
- [ ] Ship adapters for `class-validator` and a no-op validator by default.
- [ ] Allow per-build overrides (`builder.build({ skipValidation: true })`).

## Phase 6 · Testing Strategy
- [ ] Port legacy behaviour tests from `.reference` to guard parity where desired.
- [ ] Add targeted unit tests for schema adapters, builder state transitions, and error cases.
- [ ] Create integration tests demonstrating interface mode, class mode, and custom adapters.
- [ ] Benchmark builder creation/build operations to ensure no regressions against legacy.

## Phase 7 · Documentation & Migration
- [ ] Update README with new quick-start examples for both factories.
- [ ] Write a migration guide mapping legacy proxy calls to the new API.
- [ ] Provide codemod or manual checklist for common refactors (`Builder(Foo)` → `DtoBuilder.forClass(Foo)`).
- [ ] Highlight deprecated APIs and planned removal timeline in the CHANGELOG.

## Phase 8 · Release Readiness
- [ ] Validate package entry points, tree-shaking, and type declarations via `tsup` build.
- [ ] Run end-to-end tests in downstream projects (gherkin, injection) to ensure compatibility.
- [ ] Prepare announcement notes summarizing breaking changes and rationale.
- [ ] Tag and publish the 1.0 release once all boxes are checked.
