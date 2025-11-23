<!-- cspell: disable -->

# Autometa v1 Demo Cleanup Recommendations

_Model: GPT-5.1-Codex (Preview)_

## Context
- Repository: `autometa`
- Focus areas: Brew Buddy Vitest example (`examples/vitest-functions`) and supporting core packages under `packages/`
- Goal: elevate the v1 example suite to reference quality while reducing duplicated infrastructure across the monorepo.

## Example Library Opportunities
1. **World modularity**
   - `src/world.ts` currently mixes menu, orders, tags, streaming, pricing, and lifecycle state. Split into feature-focused modules (e.g., `menu-world.ts`, `order-world.ts`) and compose via `WORLD_INHERIT_KEYS` to make responsibilities clearer.
   - Move scenario-specific registries (menu snapshot, simulated events, tag registry) into dedicated services registered in `brew-buddy-app.ts` so consumers see scoped DI best practices.

2. **Composition & DI lifecycle**
   - `BrewBuddyStreamManager` implements manual disposal via `AfterScenario`. Implement a `dispose()` method on the service and rely on the DI container’s scoped disposal instead, showcasing Autometa’s lifecycle hooks.
   - Showcase HTTP client plugins by registering `@autometa/http` logging/correlation plugins inside `registerBrewBuddyServices`.

3. **Step ergonomics**
   - Standardize on either `(this: BrewBuddyWorld, ...)` or `(world)` signatures. Mixing both (see `requests.ts`, `menu.ts`) is confusing to newcomers.
   - Demonstrate `stepsEnvironment.flow` from `@autometa/app` to show fluent step composition.

4. **SSE realism**
   - `streaming.ts` simulates events directly in the world. Replace simulations with true SSE consumption from `examples/.api` so the example proves long-lived event handling, error propagation, and retries.

5. **Redundant helpers**
   - Remove or relocate duplicated utilities:
     - `utils/json.ts` reimplements coercion already available via `@autometa/gherkin` tables.
     - `utils/assertions.ts` duplicates guards available in `@autometa/asserters` and JSON-path checks that could live in `@autometa/assertions`.
   - Delete unused or legacy files (`support/bootstrap.ts`, `caseInsensitivePatterns` helper) to reduce noise.

6. **Documentation**
   - Expand `examples/vitest-functions/README.md` with architecture diagrams, composition root explanation, and dev workflow (API setup, running via CLI, debugging tips).

## Core Package Alignment
1. **Assertion plugins**
   - Upstream the Brew Buddy response/json plugins into `@autometa/assertions` so examples consume them via `.assertionPlugins(...)`. This avoids bespoke ensure wrappers in each example.
   - Highlight `@autometa/asserters` in docs and use it inside examples instead of re-implementing `assertDefined`, `assertLength`, etc.

2. **HTTP client features**
   - Document retries, schema validation, and streaming helpers in `@autometa/http` README; add example usage to Brew Buddy so adopters see real-world configuration (e.g., response schema binding for `/menu`).

3. **Table APIs**
   - Showcase `HorizontalTable.asInstances` with transformers instead of manual DTO parsing. Update docs to emphasize built-in coercion so users don’t roll their own `normalizeValue` helpers.

4. **Lifecycle & disposal**
   - Document the DI container’s `dispose()` semantics in `packages/injection/README.md` and reference it from the example to encourage scoped resource cleanup without manual hooks.

5. **Step DSL documentation**
   - Flesh out `packages/app/README.md` (currently empty) with guidance on `createStepDefinitions`, the flow builder, and scope managers so examples can link to official docs instead of relying on source spelunking.

## Suggested Next Steps
1. Refactor Brew Buddy world/services into feature modules and cut redundant utilities.
2. Wire real SSE flows and HTTP plugins to demonstrate advanced features (stream handling, retries, schema validation).
3. Upstream common assertion helpers and update examples to consume them via Autometa packages.
4. Fill out README content for core packages (`app`, `runner`, `http`, `assertions`, `injection`) and cross-link from the examples.

These steps should leave the v1 example suite feeling canonical, reduce maintenance overhead, and highlight Autometa’s unique features instead of re-implementing them locally.
