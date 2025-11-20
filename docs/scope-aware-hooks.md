# Hook & Scope Lifecycle Rework

## Goals
- Execute feature, rule, outline, and scenario hooks according to their intended lifetimes (once per scope, not once per scenario).
- Align DI containers and world objects with the Cucumber scope hierarchy so state flows downward naturally.
- Provide a foundation for decorator-based scopes and world proxies.

## Required Changes
1. **Execution Pipeline** (`@autometa/executor`)
   - Update the coordinator/runner so it constructs feature and rule scope plans with explicit lifecycle events.
   - Create feature-level worlds and containers before the first scenario executes; tear them down after the feature finishes.
   - Derive rule/outline containers as children, reusing them across the scenarios they own.
   - Continue creating scenario worlds per scenario/example but attach them to the scope tree.

2. **Hook Dispatch**
   - Ensure `BeforeFeature`/`AfterFeature` run exactly once per feature, `BeforeRule`/`AfterRule` once per rule, etc.
   - Pass the correct scoped worlds (or structured context objects) into each hook so they can persist state upstream.

3. **World & Container Management**
   - When creating child containers, set the parent relationship so services with broader scopes resolve shared instances.
   - Dispose containers/worlds in reverse order respecting the hierarchy (scenario → outline → rule → feature).
   - Integrate the WORLD proxy so injections never expose the app reference.

4. **Runner Coordination**
   - Adapt `coordinateRunnerFeature` and related builder helpers to work with the new scope-aware plan.
   - Provide helpers for tests/examples to coordinate feature execution under the revised lifecycle.

5. **Testing**
   - Add executor integration tests covering each hook type and verifying invocation counts.
   - Validate that state stored in feature/rule services is visible to descendant scenarios.

6. **Documentation**
   - Document the new lifecycle, including diagrams or tables showing when each hook runs.

---
