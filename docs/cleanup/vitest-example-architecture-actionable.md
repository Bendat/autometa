Raptor mini (Preview) — automated expert review of the `examples/vitest-functions` architecture

This file is a short, actionable analysis of the non-decorator Vitest example shipped in
`examples/vitest-functions` and how it maps to the core Autometa packages (packages/).

Goal: make `examples/vitest-functions` a canonical, high-quality, *minimal but complete*
reference for consumers of Autometa — showcasing best practices, first-class integration
points, and avoiding duplicated or brittle example-only code.

Working summary
---------------

- The example is comprehensive and demonstrates many framework features: parameter types,
  composition root, a typed world, lifecycle hooks and custom assertion plugins. It is a
  great teaching surface and already shows many best-practice patterns.
- The example includes handcrafted utilities (assertion helpers, JSON path resolution,
  SSE parsing, a stream manager and a fair bit of world plumbing). Some of these are
  duplicated by packages under `packages/` (e.g. `@autometa/assertions`, `@autometa/asserters`,
  `@autometa/http` and DI/scope features in `injection` & `scopes`). These duplicates
  increase maintenance burden and reduce clarity for users who should learn the first-
  class APIs.

This file lists concrete findings, priorities and proposed next steps so the example
becomes a smaller, clearer, and more idiomatic reference that showcases Autometa’s
first-class features instead of reimplementing them.

Findings (high level)
---------------------

1) Assertion duplication (HIGH)
   - `examples/vitest-functions/src/utils/assertions.ts` implements many helpers already
     provided by `@autometa/assertions` and `@autometa/asserters`. Examples: assertDefined,
     assertEqual, assertDeepEqual, assertCloseTo, collection checks and the JSON-path
     helpers. Mixing custom ad-hoc assertions with Autometa's `ensure()` reduces type
     narrowing and hides the fluent API consumers should learn.

2) SSE / streaming (MEDIUM)
   - The example implements an SSE parser and a local stream manager (connectSse,
     SseSession, BrewBuddyStreamManager). However streaming is only partially exercised
     in scenarios (often simulated) and there is no first-class SSE transport in
     `@autometa/http` or a shared streaming utility in packages. This leads to two issues:
     a) duplication (parsing logic), and b) the example not demonstrating a real
     end-to-end streaming flow (the API side often only simulates events).

3) Resource & DI ergonomics (MEDIUM)
   - `BrewBuddyApp` and the stream manager are constructed/managed manually in the example.
     Autometa has a DI container and scope lifecycle hooks. The example would benefit from
     showing how to register scoped services (HTTP client, SSE session, stream manager) and
     rely on scoped disposal for deterministic cleanup.

4) World size & mutable state (LOW→MEDIUM)
   - The `world` model contains a lot of state. This is great for the example’s richness,
     but could confuse readers about recommended minimal-world design. It should be pared
     back to essentials or clearly split between persisted scenario state vs ephemeral step
     state and better documented.

5) Missing / light testing of helper utilities (LOW)
   - Utilities such as JSON path resolution, SSE parsing, and domain assertions have few or
     no unit tests inside the example. Tests here help the example stay correct and serve as
     a learning reference for consumers.

Concrete recommendations & priorities
-----------------------------------

Priority = {HIGH, MEDIUM, LOW}

1) (HIGH) Replace example-level adhoc assertions with first-class ensure/matcher usage
   - Remove / shrink `utils/assertions.ts` to only show example-specific matches and
     migrate everything generic into `packages/assertions` or `packages/asserters`.
   - Create an official `examples/shared` small plugin showing how to author an
     assertion-facet with `createEnsureFactory` and show it imported in the example.
   - Benefit: promotes single source-of-truth and TypeScript narrowing via `ensure()`.

2) (MEDIUM) Make streaming a first-class example or remove it from the core example
   - Two approaches: implement a real streaming endpoint in `.api` and wire it to the
     example (best) OR move streaming to a dedicated example and keep vitest-functions
     focused on typical API flows.
   - If keeping streaming: factor the SSE parser into `packages/http` as a reusable
     transport plugin and add unit tests that show real round-trip behavior.

3) (MEDIUM) Teach DI & scoped resources in the example
   - Register BrewBuddyHttpClient, BrewBuddyStreamManager and similar as scoped services
     in the example CompositionRoot using the project's DI API, demonstrate SCENARIO
     scoped disposal to avoid manual dispose calls.

4) (LOW → MEDIUM) Reduce world surface or split world responsibilities
   - Present a minimal baseline world in README or small doc and keep extended world
     contents behind a clear comment that this file is intentionally verbose for demo
     purpose. Consider splitting scenario-only ephemeral state from cross-scenario
     shared test-agent state.

5) (LOW) Add tests for the example helpers
   - Add vitest specs (simple) for JSON path resolution, SSE parser and the assertion
     plugin helpers. This makes migrations safer and the example easier to reuse.

Implementation plan / quick steps
--------------------------------

1) Implement a small `examples/shared/assertions` plugin using `@autometa/assertions` and
   convert `utils/assertions.ts` calls to import that plugin (2–4 hours).
2) Add a short guide to the example README showing how to register assertion plugins and
   register typed world facets (1 hour).
3) Decide on SSE: either extract connectSse to `packages/http` + tests or move streaming into
   a separate streaming example (4–8 hours depending on choice).
4) Register the HTTP client and stream manager as SCENARIO scoped services and demonstrate
   automated disposal. Update one or two steps to use injected services (2–3 hours).
5) Add unit tests for the example utilities (1–2 hours).

Follow-up questions (for prioritisation)
--------------------------------------

1) Do we want the vitest example to showcase streaming? If yes, prefer adding a real
   streaming endpoint to `.api` and extracting SSE parsing into `packages/http`.
2) Are we comfortable moving example helper logic into core packages (e.g. assertions) or
   should we keep them as `examples/shared`? My recommendation: prefer core packages for
   generic helpers (ensures, asserters) and `examples/shared` for example-only glue.

Files I inspected (non-exhaustive)
---------------------------------

- examples/vitest-functions/src/world.ts
- examples/vitest-functions/src/step-definitions.ts
- examples/vitest-functions/src/support/bootstrap.ts
- examples/vitest-functions/src/utils/assertions.ts
- examples/vitest-functions/src/utils/json.ts
- examples/vitest-functions/src/utils/sse.ts
- examples/vitest-functions/src/services/stream-manager.ts

Relevant packages and candidates for reuse or extraction
------------------------------------------------------

- packages/assertions — matchers & ensure factories (move generic helpers here)
- packages/asserters — assertion utilities (type guards and helpers)
- packages/http — add an SSE transport / parser plugin
- packages/injection + packages/scopes — demonstrate scoped registration and disposal

Short closing notes
-------------------

The example is already excellent as a teaching surface. With modest focused changes
we can make it leaner, maintainable and the canonical route for developers to learn
“the Autometa way” — using ensure plugins, scoped services, and the first-class
HTTP tooling present in the repo.

If you want, I can now:

- Convert `examples/vitest-functions` assertions to a small shared plugin and open a
  PR splitting the generic parts into `packages/assertions` (recommended first step).
- Or I can draft the scoped DI changes (registering the HTTP client and stream manager).

Which of those should I tackle next? — I can start the migration and add unit tests to
prove behavioral parity.
