<!-- cspell:disable -->
# Autometa Vitest Function-Style Example Review
_Model: GPT-5-Codex (Preview)_

## Executive summary
- The Vitest (non-decorator) example successfully exercises large portions of the BrewBuddy domain but currently reads as a direct port from an internal test harness rather than a curated learning resource. Restructuring toward domain-first modules, explicit typing boundaries, and richer Autometa integrations will make it a stronger reference implementation.
- Across the core packages we are re-implementing behaviours that already ship inside Autometa (assertion helpers, DI ergonomics, HTTP metadata, step composition helpers). Surfacing those first-party features inside the example will both reduce maintenance and better showcase the platform’s capabilities.
- There are several missing glue pieces (unregistered step modules, unused utilities, ad‑hoc logging) that create “broken windows”. Tightening those gaps alongside improved documentation/tests within the example will lift overall quality.

## Vitest example: key observations and opportunities
### Structure & discoverability
- Folder layout is technology-oriented (`utils/`, `services/`, `steps/`) which makes it harder for newcomers to trace a feature end-to-end. Consider regrouping by domain (`menu/`, `orders/`, `streaming/`) with an index barrel per domain that registers steps, utilities, and supporting services together.
- `src/steps/index.ts` omits modules such as `streaming.ts` and `table-examples.ts`; as written those step definitions are never registered by the runner. This undermines test coverage and can confuse adopters reading the example files.
- `support/bootstrap.ts` is an empty shim. Either delete it (and remove the reference from config) or upgrade it to demonstrate real pre-run wiring such as environment validation or feature toggles.

### World & state management
- `BrewBuddyWorldBase` carries many mutable buckets (`scenario`, `aliases`, `lifecycle`, `features`) with overlapping responsibilities. Introducing explicit sub-objects (e.g. `orders`, `menu`, `streaming`) with typed accessors will reduce incidental coupling and make lifecycle resets clearer.
- `BrewBuddyMemoryService` mirrors data already available on the world. We can instead expose snapshot helpers on the world (or leverage Autometa’s scope-aware hooks) and reserve services for true process logic.
- `WORLD_INHERIT_KEYS` is configured but we never demonstrate multi-layer worlds. Add an example scenario where feature- or rule-level fixtures populate inheritable state to highlight why the symbol exists.

### Step definition ergonomics
- Step files mix three invocation styles (`this` binding, explicit `world` argument, variadic helper that backfills both). Pick one convention per file (preferably `function (this: BrewBuddyWorld, ...)` to exploit Autometa’s contextual typing) and add lint/tests to keep it consistent.
- Several steps perform defensive argument checks that Autometa already provides through expression typing (e.g. `{int}`, `{float}`). We can rely on typed captures for inline validation and reserve manual guards for complex structures.
- Repeated docstring/table plumbing (`splitArguments`, manual `world.runtime` checks) can be replaced with Autometa’s `ensure` wrappers or a custom step helper imported from `@autometa/app`’s flow builder. This will reduce boilerplate and better showcase the DSL.

### HTTP and API interactions
- `performRequest` wraps `world.app.request` but discards Autometa HTTP features such as schema validation, retry policy, correlation id tracking, and response transforms. Define per-endpoint clients via `HTTP.schema`, `HTTP.retry`, and named routes to demonstrate real-world configuration.
- Error handling currently mutates `world.lastResponse*` inside `extractErrorStatus`. Prefer `HTTPError`’s `response` snapshot plus typed error facets (e.g. add a `ensure(world).response.toHaveStatus(...)` helper) to avoid state divergence when assertions fail.
- Our example hardcodes `.api` domain types via relative imports. Shipping slim DTO slices inside the example (or consuming generated types) keeps the demo standalone and easier to lift into another codebase.

### Streaming & async workflows
- `BrewBuddyStreamManager` manually mirrors world state and requires consumers to remember to call `dispose`. We could wrap the SSE session in a scoped resource registered through Autometa’s container, ensuring automatic teardown via `Scope.SCENARIO` disposal hooks.
- `connectSse` re-implements parsing; consider leaning on existing EventSource polyfills or factor the parser into `packages/http` as a reusable transport plugin so end-users gain the same functionality.
- Streaming steps only simulate events and never assert integration with the live SSE client. Add a happy-path scenario that exercises `waitForEvent` against the mocked session to demonstrate full-duplex flows.

### Assertions & verification
- `utils/assertions.ts` recreates features already exposed by `@autometa/assertions` and `@autometa/asserters` (e.g. `assertDefined`, equality helpers). Instead, register custom ensure plugins via `.assertionPlugins` and surface bespoke matchers (`ensure(world).response`) there.
- JSON path resolution (`json.ts`) is hand-written. We could either move it into `@autometa/assertions` as a reusable matcher or swap to an established library (`jsonpath-plus`) and showcase how to plug it through ensure factories.
- Numeric comparisons (`ensureCloseTo`) reinvent `EnsureChain#toBeCloseTo` (available via jest-compatible matchers). Either expose that matcher or add it to the shared assertions package so examples align with Autometa defaults.

### Lifecycle & telemetry
- Lifecycle logging is optional but defaults to `console.info`, which clutters the output. Showcase Autometa’s hierarchical reporting hooks instead (e.g. redirect logs through the reporter or `world.runtime.attachLogCollector`).
- We maintain lifecycle metrics manually (`beforeFeatureRuns`, `scenarioOrder`). Autometa runner already tracks execution metadata; expose it via `world.runtime` or custom reporters rather than duplicating arrays in the world.

### Testing & maintainability
- There are no unit tests for helper utilities (`json`, `assertions`, `sse`). Adding a handful of Vitest specs within the example keeps regressions visible to consumers reading the repo.
- Introduce lint rules (or simple `vitest` snapshots) to ensure every file in `steps/` is imported by the aggregator and that unused helpers (e.g. `caseInsensitivePatterns`) are removed.
- Provide a short `README` or `USAGE.md` under the example that walks through running the BrewBuddy API stub plus executing the feature suite (without relying on external docs).

### Suggested action items (example)
- **High priority**
  - Restructure directories by domain and register all step modules automatically.
  - Replace bespoke assertion helpers with `@autometa/assertions` plugins and add typed world facets.
  - Adopt scoped services/resources for SSE and HTTP clients, leveraging DI teardown.
- **Medium priority**
  - Add schema-aware API clients and real streaming tests.
  - Document the example’s bootstrapping flow and enforce lint/tests for step registration consistency.
- **Low priority**
  - Promote lifecycle metrics to a reporter demo and slim the world to essential state.
  - Evaluate external libraries (JSONPath, EventSource) for utilities currently hand-rolled in `utils/`.

## Core packages: observations & opportunities
### `@autometa/assertions`
- We already support plugin-driven ensure facets (`createEnsureFactory`) yet the example hand-builds ensure wrappers. Provide a pre-packaged BrewBuddy assertions plugin (inside `packages/assertions` or `examples/shared`) that consumers can import directly.
- Consider adding JSON-path helpers, timestamp placeholders, and close-to comparisons to the core library to eliminate the need for example-specific helpers.

### `@autometa/asserters`
- Contains `assertDefined`, length checks, and type guards that our example reimplements. Surface these utilities prominently in docs and update examples to use them so we are not maintaining competing implementations.

### `@autometa/http`
- Offers rich configuration (schema validation, retries, streaming) but the example only sets a base URL and headers. Expand package docs with quick recipes and update examples to use `sharedSchema`, `requireSchema`, and plugin logging instead of bespoke wrappers.
- SSE support is currently absent; elevating the example’s parser into a first-class plugin (e.g. `http.pluginEventStream`) would prevent future duplication and benefits all consumers.

### `@autometa/injection`
- Provides decorators (`Inject`, `LazyInject`) in addition to manual container wiring. Even though this example is “non-decorator”, highlighting the decorator workflow in a sibling example will reduce perceived complexity and prevent bespoke injection helpers from popping up.

### `@autometa/runner`
- The runner builder exposes `steps().ensure` and `steps().flow`, but the example sticks to raw Given/When/Then calls. Updating the documentation to emphasise flow builders, `coordinateFeature`, and inheritance via `WORLD_INHERIT_KEYS` will help teams adopt advanced scenarios without re-implementing scope management.
- We should showcase automatic hook wiring (Before/After registration) through helper utilities rather than manual increments of lifecycle counters inside examples.

### Cross-package alignment
- Several packages silently depend on `node` built-ins (`node:util`, `node:stream/web`). Provide browser-safe fallbacks or guard those imports so examples targeting edge runtimes do not need to fork utilities.
- Establish shared test fixtures (e.g. BrewBuddy DTOs) in a workspace package instead of `.api` directories inside examples to avoid fragile relative imports.

## Recommended next steps
1. **Design** a domain-oriented folder structure for the Vitest example, including automatic registration of every step module and world facet.
2. **Extract** common assertion/JSON/SSE helpers into reusable packages or plugins, then refactor the example to consume them.
3. **Enhance** the HTTP client usage to demonstrate schema validation, retries, and logging plugins, adding at least one regression test per helper.
4. **Document** the updated workflow (bootstrap, running features, extending assertions) in a dedicated README while trimming legacy placeholder files.
5. **Backport** improvements into package docs to ensure every showcased capability has a first-class explanation outside the example.

Completing the high-priority items above will transform the Vitest example into a polished, authoritative reference and simultaneously reduce duplication across the Autometa codebase.
<!-- cspell:enable -->