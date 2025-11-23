Model: GPT-5.1-Codex-Mini (Preview)

## Objective
Deliver a standalone architecture review of the `@autometa/examples-vitest-functions` demo so the team can prioritise concrete improvements. Spotlight places where the example is rolling its own plumbing instead of showcasing the Autometa feature set, and call out package-level capabilities that we are currently under-utilising or duplicating.

## Example-level insights

### World & lifecycle plumbing
- `BrewBuddyWorld` collects a lot of scenario state (e.g., `features`, `ancestors`, entire lifecycle metrics) that the demo never consumes. Trimming the world to only the state that steps read/write keeps the example focused and lowers the cognitive load for newcomers.
- Lifecycle hooks (`BeforeScenario`, `AfterStep`, etc.) are hand-written yet already covered by the runner’s lifecycle logging/hooks. We could turn the metrics capture into a packaged reporter example (e.g., push `stepHistory` into a dedicated `LifecycleReporter` service) while keeping the world lean.
- Steps like the ones in `steps/requests.ts` still carry `splitArguments`/`runtime` plumbing to differentiate between implicit world arguments and explicit docstrings. The same behaviour can be expressed crisply with Autometa’s `flow` builder or helper utilities from `@autometa/app` so every step just receives `(world, …args)` and the runtime helpers stay hidden.

### Assertions & verification
- `utils/assertions.ts` clones general helpers (`assertDefined`, `assertStrictEqual`, numeric tolerance checks, HTTP response ensure wrappers) that already live inside `@autometa/assertions` and `@autometa/asserters`. We should aim to turn this into a custom ensure plugin (registered via `.assertionPlugins`) that directly exposes `ensure(world).response` and `ensure(world).json` helpers. This keeps the example’s assertions idiomatic and lets consumers see how to extend Autometa’s matcher surface.
- `ensureCloseTo` reimplements `toBeCloseTo`, while `toPathExpectations` is a wrapper around `ensure(...).json`. Instead, we should highlight that `ensure(world).response.toHaveStatus(...)` works out of the box, and reserve custom helpers for truly domain-specific assertions (e.g., tagged menu expectations). The JSON path resolution itself could be replaced with `jsonpath-plus` or, better yet, promoted into a shared matcher inside `@autometa/assertions` so it can be reused by other examples.

### HTTP, streaming, and SSE handling
- `performRequest` mutates `world.lastResponse*` directly before re-throwing; `extractErrorStatus` then reuses those mutated values. We should instead rely on `HTTPError`’s snapshot (its `response` field) and funnel errors through the ensure plugins so state is consistent even if the step stops before re-populating `world` fields.
- `BrewBuddyStreamManager` mirrors world state just to track warnings/errors and the latest session. Autometa already has `ScopeLifecycle`/`ScopeManager` hooks for automatic disposal and a DI container we can use to provide the SSE session as a scoped resource. Registering the stream via `Scope.SCENARIO` and letting the container dispose it eliminates the manual `dispose()` calls in `AfterScenario`.
- `connectSse` re-implements the SSE parser inside the example. We should either lift that parser into `packages/http` (e.g., as a transport plugin or factory that returns an `SseSession`) or reuse an existing EventSource polyfill. That way the example can demonstrate how to plug into Autometa’s HTTP client streaming model and show the consumer code that waits for events rather than faking them.
- Streaming steps currently simulate SSE events by calling helper methods (no real session verification). Adding a happy-path scenario that uses the actual session’s `waitForEvent`/`waitForCount` APIs would make the demo feel complete, proving that Autometa can handle full-duplex interactions.

### Step composition & DI
- The example manually wires `CompositionRoot` and registers services (`BrewBuddyMemoryService`, `BrewBuddyStreamManager`) using plain registration helpers. We should emphasise `@autometa/injection`’s scoped tokens, service factories, or even `bind-decorator` so consumers see how Autometa’s DI can transparently inject the world, resources, and scoped services without additional boilerplate.
- Parameter types (`support/parameter-types.ts`) already illustrate custom expressions, but we still manually manage context (e.g., writing to `world.scenario.region`). Introducing dedicated parameter-type helpers (or reusing the runner’s parameter registry) would better showcase how Autometa keeps step definitions data-driven.

### Test coverage gap
- None of the helper modules (`utils/json.ts`, `utils/assertions.ts`, `utils/sse.ts`) have Vitest specs. Adding a small test suite inside the example (even if superficial) demonstrates that the recommended patterns are testable and protects future refactorings.

## Package-level leverage opportunities

- **`@autometa/assertions` / `@autometa/asserters`**: instead of re-exporting assertion helpers inside the example, register custom ensure plugins (`ensure(world).response`, `ensure(world).json`) that leverage the packages’ existing matchers. Share the general helpers (e.g., `assertDefined`) through these packages so the example just imports them directly, keeping the demo focused on how to extend the matcher surface.
- **`@autometa/app`**: the `createStepDefinitions.flow` API and `StepFlowBuilder` already handle runtime/world argument inference. The example should import the `flow` helper and chain steps to avoid manual argument splitting/config checks, allowing testers to write expressive, context-aware steps without boilerplate.
- **`@autometa/executor`**: we already use tag handling manually in `steps/tags.ts`. The executor exposes `createTagFilter`, `ScopeLifecycle`, and hook logging utilities. Reusing those (e.g., by wiring `tagExpression` handling through `createTagFilter`) would demonstrate how Autometa filters scenarios instead of mocking lists inside the example.
- **`@autometa/http`**: the HTTP client supports streaming responses, injectable plugins, and logging (see `createLoggingPlugin`). We should show how to plug the SSE client into Autometa’s HTTP stack (either as a transport or plugin), reuse the built-in logging plugin for diagnostics, and treat `HTTPError` responses as typed ensures instead of mutating world state in `performRequest`.
- **`@autometa/injection`/`bind-decorator`**: emphasise scoped binding rather than manually instantiating services. A proposed refactor could have `BrewBuddyStreamManager` receive the SSE session via DI and register teardown through injection lifecycle hooks to lean on the executor’s resource manager.

## Proposed next steps
1. **Build a bespoke ensure plugin** that exposes `response`/`json` helpers, deletes the custom assertion utilities, and registers it with the runner so steps can call `ensure(world).response.hasStatus(...)` without rediscovering the core matcher surface.
2. **Rework HTTP + SSE handling**: rely on `HTTPError.response`, move `connectSse` parsing into `packages/http` (optionally as an official SSE transport), and register the session as a scoped resource in the container so `AfterScenario` no longer needs to dispose it manually. Add an integration scenario that exercises the real SSE client.
3. **Simplify step definitions** by embracing the `flow` builder or dedicated helper wrappers, dropping `splitArguments`/`runtime` lookups, and favouring typed hooks. This keeps the demo lightweight and lets readers focus on data, not plumbing.
4. **Add lightweight Vitest specs** for `utils/json.ts`, `utils/assertions.ts`, and `utils/sse.ts` to document behaviour and guard future refactors.
5. **Document package-level lessons** in the new cleanup note (this file) and use it as guidance when tidying other examples—especially showing how core packages eliminate duplicate code.

## Questions / clarifications
- Should the SSE parser live inside `packages/http` as an official transport (so other consumers can reuse it), or keep it example-local but extracted to a shared helper within `examples/`?
- Do we want to promote `LifecycleMetrics` into a reusable helper/report instead of keeping it in the world, so the example can highlight Autometa’s hook instrumentation?