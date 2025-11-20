# Fluent Builder Refactor

## Goals
- Replace the existing `.app(...)` builder method with `.appWithFactory(...)` across the codebase.
- Introduce `.appWithExperimentalDecorators(...)` to support decorator-driven app composition without forcing manual `createDecorators` wiring in examples.
- Maintain type safety around world augmentation and ensure caching/invalidations continue to work when app configuration changes.

## Required Changes
1. **Runner Builder API**
   - Update `RunnerBuilder` and `RunnerBuilderImpl` (see `packages/runner/src/builder/create-runner-builder.ts`) to expose `appWithFactory` and `appWithExperimentalDecorators`.
   - Remove the legacy `.app` method and migrate internal state (`state.appFactory`) to work with the new signatures.
   - Export new types from `packages/runner/src/index.ts` to keep public API aligned.

2. **World Factory Composition**
   - Adjust `composeWorldFactory` to understand the new app factory abstractions.
   - Ensure the world still receives the `app` instance and DI container bindings.

3. **Call Sites**
   - Update all usages (examples, tests, docs) to call `.appWithFactory(...)` or `.appWithExperimentalDecorators(...)`.
   - Modify `examples/vitest-functions/src/step-definitions.ts` accordingly.

4. **Tests**
   - Refresh unit tests in `packages/runner/src/builder/__tests__/create-runner-builder.test.ts` to cover the new methods.
   - Add tests validating the experimental decorator path once the orchestrator exists.

5. **Documentation**
   - Capture changes for release notes and README references after implementation.

---
