# @autometa/events (v1 draft)

Autometa's event bus coordinates feature, rule, scenario, example, background, step, and hook lifecycles during a test run. The v1 rewrite introduces a richer taxonomy so runners can react to each Gherkin stage explicitly and attach structured context to their hooks.

## Hook Vocabulary

`HookKind` now exposes per-stage before/after hooks in addition to runner-level setup/teardown:

- `beforeFeature` / `afterFeature`
- `beforeRule` / `afterRule`
- `beforeScenario` / `afterScenario`
- `beforeScenarioOutline` / `afterScenarioOutline`
- `beforeExample` / `afterExample`
- `beforeBackground` / `afterBackground`
- `beforeStep` / `afterStep`
- `setup` / `teardown`
- `custom`

Each hook descriptor can include the feature, rule, scenario, outline, example, background, or step it targets so downstream tooling can scope side effects precisely.

## Event Payloads

Lifecycle events follow the same granularity (`feature.*`, `rule.*`, `scenario.*`, `scenarioOutline.*`, `example.*`, `background.*`, `step.*`). They carry the originating pickles, references, and metadata required to trace execution across async boundaries.

The dispatcher guarantees in-order delivery. Emitters construct canonical payloads with generated IDs and timestamps so subscribers always receive comparable shapes regardless of the underlying runner.

## Migration Notes

Legacy `beforeEach`/`afterEach` and `beforeAll`/`afterAll` handlers must be remapped to the explicit stage hooks above. Packages awaiting migration (e.g. `@autometa/scopes`, `@autometa/test-builder`) should budget time to adopt the new event names when they move onto the v1 stack.