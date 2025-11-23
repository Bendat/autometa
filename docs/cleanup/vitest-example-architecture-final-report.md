<!-- vale off -->
<!-- cspell: disable -->

# Autometa Vitest Example Consolidated Cleanup Report

**Model:** GPT-5.1-Codex (Preview)  
**Date:** 23 November 2025

## Scope
This report combines the most accurate recommendations from prior cleanup notes. All suggestions were re-validated against the current `refactor/v1-rewrite` branch. Each action is grouped so that teams can:
1. Update the `examples/vitest-functions` package immediately with today’s framework surface area.
2. Enhance Autometa’s framework libraries where clear gaps exist.
3. Circle back to the example after the library improvements to showcase the new capabilities.

---

## 1. Immediate changes to `examples/vitest-functions`
These can be delivered without modifying any framework packages.

### 1.1 Step ergonomics & world usage
- **Drop `splitArguments` and mixed signatures** (`src/steps/requests.ts`, `menu.ts`, `streaming.ts`). Standardise on the `(…captures, world: BrewBuddyWorld)` style that Autometa already injects. This removes ~80 lines of guard logic and makes IDE inference work consistently.
- **Keep world state leaner.** Move rarely used data (`tagExpression`, `streamWarnings`, etc.) out of `BrewBuddyWorldBase` into feature-focused services (`tag-registry.service.ts`, `stream-state.service.ts`). The DI container already provides `Scope.SCENARIO` services, so the example can demonstrate composition without ballooning the world interface.

### 1.2 Assertions & validation
- **Retire redundant helpers** in `src/utils/assertions.ts`. Replace `assertDefined`, `assertStrictEqual`, `assertCloseTo`, etc. with existing `ensure()` matchers (`toBeDefined`, `toStrictEqual`, `toEqual`). Keep only the response/json plugins—the bespoke JSON path/timestamp helpers stay for now because the framework lacks them.
- **Increase runtime feedback** by labelling `ensure()` chains (e.g., `.response.hasStatus`) so failure messages point to the scenario expectation rather than a generic "HTTP failure" message.

### 1.3 Service boundaries & HTTP flow
- **Introduce a dedicated `BrewBuddyClient`.** Move the logic from `performRequest` and `extractErrorStatus` into a composable client that encapsulates `lastResponse*` bookkeeping. This shows off best-practice DI usage and avoids world mutation from every step file.
- **Clarify streaming behaviour.** Today’s streaming steps (`src/steps/streaming.ts`) push simulated events into `world.scenario.simulatedEvents`. Make that explicit in the feature narrative (e.g., rename steps to "simulate order stream events") or quarantine them into a dedicated `streaming-simulated` feature until real SSE support lands.

### 1.4 Testing & documentation
- **Add Vitest specs** for `utils/json.ts`, `utils/assertions.ts` (remaining helpers), and `utils/sse.ts`. Even smoke tests catch regressions in JSON-path parsing and SSE buffering, which currently lack coverage.
- **Document the architecture.** Expand `examples/vitest-functions/README.md` with:
  - Diagram or bullet summary of composition root → services → steps.
  - Instructions for resetting the Brew Buddy API stub (`/admin/reset` endpoints already exist).
  - A section describing the simulated streaming workflow so users know it is not yet end-to-end.
- **Remove dead code** (`support/bootstrap.ts`, unused `caseInsensitivePatterns` helper) so newcomers see only intentional surface area.

---

## 2. Framework library changes
These items unblock duplicated logic in the example and give consumers first-class APIs.

### 2.1 `@autometa/assertions`
- **Export numeric tolerance matchers** (`toBeCloseTo`, `toBeWithin`). The example currently re-implements tolerance checks in both `menu.ts` and `utils/assertions.ts` because no built-in matcher exists.
- **Add JSON-path helpers** (e.g., `ensure(world).json.path("items[0].price").toEqual(6)`). Without this, every consumer must copy the example’s `resolveJsonPath`.
- **Support placeholder matchers** for timestamps/IDs so tables can assert `<timestamp>` without bespoke placeholder objects.

### 2.2 `@autometa/runner`
- **Export hook metadata types** (the example’s `HookMetadata` mirrors internal decorator types). Making this public removes copy-paste types from every consumer that wants structured hook logging.

### 2.3 `@autometa/http`
- **Provide an SSE transport / plugin.** There is no `.stream()` API today, so consumers re-implement `connectSse`. Shipping a built-in helper would standardise connection management, error surfacing, and lifecycle disposal.
- **Expose advanced client builders** (retry, schema, timeout) in docs so examples can move beyond manual switches.

### 2.4 `@autometa/app` & documentation
- **Fill in the README.** The package currently says "There's nothing here yet". Document `createStepDefinitions`, the flow builder, and scope inheritance so example authors stop re-learning these patterns.

### 2.5 `@autometa/dto-builder`
- **Highlight test-data builders** in docs and quickstarts. They are absent from the vitest example because it is unclear how to compose them with Cucumber tables. Provide a small recipe that reads a table row and emits a builder-configured DTO.

---

## 3. Example updates after framework improvements
Once the above library features ship, loop back to the example to showcase them.

### 3.1 Adopt new assertion capabilities
- Replace `resolveJsonPath` with the official JSON-path matcher and delete `src/utils/json.ts` entirely.
- Swap the bespoke numeric tolerance helpers for `ensure(...).toBeCloseTo`. This also simplifies the `MenuExpectation` checks and price-update flows.
- Use timestamp placeholder matchers instead of the ad-hoc `<timestamp>` logic in streaming expectations.

### 3.2 Embrace the exported runner/http types
- Import `HookMetadata` (and any other lifecycle types) directly from `@autometa/runner`, removing the local interface from `src/step-definitions.ts`.
- Replace `connectSse`/`BrewBuddyStreamManager` with the official `@autometa/http` SSE transport, letting the DI container manage cleanup automatically.

### 3.3 Showcase DTO builders and schema validation
- After `@autometa/dto-builder` guidance lands, rebuild the order helpers (`buildOrderItem`, `buildPaymentDetails`) using builders instead of manual object assembly. This tightens TypeScript inference and demonstrates our recommended data-factory pattern.
- Once `@autometa/http` exposes schema hooks, register schemas for `/menu`, `/orders`, and `/loyalty` so the example illustrates runtime validation without custom `parseOrder`/`parseLoyalty` guards.

---

## Closing notes
- All recommendations above are grounded in the current file set under `examples/vitest-functions` and the `packages/` directory as of 23 Nov 2025.
- Sequencing matters: focus first on step ergonomics, assertion cleanup, and documentation within the example; then invest in the framework gaps to prevent future duplication; finally, revisit the example to highlight the newly delivered capabilities.

<!-- cspell: enable -->
<!-- vale on -->
