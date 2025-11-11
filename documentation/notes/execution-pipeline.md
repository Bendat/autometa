# Architecture Notes: Current Autometa Execution Pipeline

## High-Level Package Roles
- `packages/scopes` exposes the DSL and scope tree; `GlobalScope` orchestrates hook/step caches and locks around feature registration.
- `packages/autometa` wires the public API: binds Cucumber-style functions, holds runtime config (`CONFIG`), coordinator options (`OPTS`), and delegates execution to Jest via `executor`.
- `packages/coordinator` resolves feature paths, loads step definitions/parameter types, builds a `FeatureBridge`, and hands control to the runtime executor with the selected `App`/`World` classes.
- `packages/jest-executor` hosts the Jest-facing runner that expands bridges into `describe`/`it` hierarchies, instantiates apps/worlds per scope, and raises lifecycle events.

## Feature Invocation Flow
1. User calls `Feature(...)` exported from `@autometa/autometa` (`packages/autometa/src/scopes.ts`).
2. Call proxies into `GlobalScope.Feature` (`packages/scopes/src/global-scope.ts`), which attaches a `FeatureScope`, infers the caller directory, and invokes `GlobalScope.onFeatureExecuted`.
3. `onFeatureExecuted` is set by `packages/autometa/src/scopes.ts`; it instantiates a `Coordinator` with the shared `Global` scope, config, and coordinator options.
4. `Coordinator.run` (`packages/coordinator/src/coordinator.ts`):
   - Unlocks the global scope to allow registration.
   - Resolves filesystem roots through `Files`, loads apps, parameter types, and step definitions based on the active config environment.
   - Locks the global scope to prevent mutation while executing.
   - Builds a `TestBuilder` for each parsed Gherkin `Feature`, yielding a `FeatureBridge` that reflects the scope tree against the Gherkin AST.
   - Chooses the configured `{ app, world }` pair from `CoordinatorOpts` (`packages/autometa/src/app.ts` populates `OPTS`).
   - Calls the injected `executor` with `{ app, world }`, the global scope, the feature bridge, runtime events, and config snapshot.
5. `packages/autometa/src/executor.ts` simply re-exports `@autometa/jest-executor`'s `execute` implementation.

## Scope Tree & Hook Resolution
- `GlobalScope` inherits from the base `Scope` and keeps shared `HookCache`/`StepCache` instances. When a child scope is created, it reuses or clones caches so hooks bubble appropriately.
- `GlobalScope.lock()` / `unlock()` gates step registration while files are being loaded by the coordinator to avoid cross-feature race conditions.
- Step registration (`Given/When/Then`) immediately attaches `StepScope` objects with Cucumber expressions built from the global parameter registry.
- Hook registration (Setup/Teardown/Before/After, plus group-specific hooks such as `BeforeFeature`) creates hook instances with optional tag filters or timeouts. Hooks are stored on the relevant scope and later executed by the Jest executor helpers (`bootstrapSetupHooks`, `bootstrapBeforeHooks`, etc.).

## Jest Executor Responsibilities
Defined in `packages/jest-executor/src/executor.ts`:
- Converts feature bridges into nested `describe`/`it` blocks while honoring `@skip`/`@only` tags (`getGroupOrModifier`, `getTestOrModifier`).
- Establishes per-scope dependency injection:
  - A global `Container` for `beforeAll` hooks instantiates a "static" `App`/`World` pair (shared across the feature for setup/teardown).
  - Each scenario/example/outline uses `beforeEach` to spin up a fresh container, caching per-test app instances in `featureApps`, `outlineApps`, etc., so after-hooks receive the correct instance lists.
- Executes hooks in a well-defined order:
  1. Setup hooks on global + feature scopes (`bootstrapSetupHooks`).
  2. Before hooks (global-first, then feature-level) before each scenario (`bootstrapBeforeHooks`).
  3. Background steps prior to scenario steps (`bootstrapBackground`).
  4. Scenario/Outline execution (`bootstrapScenarios`/`bootstrapScenarioOutline`).
  5. After hooks (feature-first, then global) post scenario (`bootstrapAfterHooks`).
  6. Teardown hooks (`bootstrapTeardownHooks`).
- Wraps each hook execution in event emissions (`TestEventEmitter`) and error handling, translating failures into `AutomationError`s with cause chains.
- Applies timeout resolution by combining the current scope timeout, hook-specific override, and config defaults via `chooseTimeout`.

## App & World Lifecycle Details
- Coordinator selects a `Class<App>` and `Class<World>` from `OPTS[environment]`.
- Jest executor caches per-scope app instances:
  - `staticApp` lives in the global container for setup/teardown hooks.
  - `localApp` is created per scenario/row/example; stored in maps keyed by Jest test names so group-level after hooks (`AfterFeature`, `AfterRule`, `AfterScenarioOutline`, `AfterExamples`) receive the full list of instances.
- Each app instance receives `world` and `di` assignments immediately after resolution from the container to ensure step callbacks have access to DI and state.
- Containers call `disposeAll`/`disposeGlobal` with tag awareness to respect injection scopes during cleanup.

## Event & Reporting Pipeline
- All lifecycle points feed `TestEventEmitter` channels (`beforeFeature`, `scenario`, `step`, etc.).
- After the feature finishes, `events.settleAsyncEvents()` is awaited to surface any unhandled asynchronous listeners, logging warnings if promises reject.
- Scenario/step failure metadata is captured via `Query.find.failed(bridge)` from `@autometa/test-builder` to determine pass/fail status for summaries.

## Timeout & Tag Filtering
- Scopes carry a `Timeout` object; hooks and scenarios can specify overrides as numbers or `[value, unit]` tuples.
- Tag-based modifiers:
  - `@skip` / `@skipped`: converts `describe`/`it` to `.skip`.
  - `@only`: promotes to focused runs.
  - `@retries=n`: consumed by executor to call `jest.retryTimes(n)` before the suite/test.
  - Arbitrary tag expressions supplied via config (`config.current.test?.tagFilter`) use `@cucumber/tag-expressions` to dynamically skip scenarios.

## Observed Pain Points & Refactor Targets
- Coordinator mixes filesystem loading, global scope mutation, and execution dispatch; consider splitting IO/config concerns from orchestration to simplify testing.
- App/World lifecycle relies on mutable globals (`OPTS`, container maps) and Jest test name keys, which complicates non-Jest adapters and parallel runs.
- Global scope locking is coarse; rewriting the world/app system may benefit from explicit registration phases or immutable scope snapshots instead of shared caches.
- Event emission is tightly coupled to executor helpers; extracting a higher-level pipeline could make alternative runners (e.g., playwright, node-only) feasible.
- Timeout selection and tag matching logic are duplicated across bootstrap helpers; centralizing this behavior would reduce churn during the rewrite.

## Open Questions
- How should new world management expose per-scenario state without relying on Jest test names? (Current fallback is the fully qualified Gherkin title chain; investigate alternate identifiers when we revisit scopes.)
- Can coordinator supply a structured execution plan (instead of a bridge) to decouple executor internals from scopes? (Yes—slated for a later refactor in coordinator/executor packages.)
- If we relax or remove global scope locking, what mechanism replaces it to keep parameter/step registration deterministic across features?
