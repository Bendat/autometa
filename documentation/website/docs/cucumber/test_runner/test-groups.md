---
sidebar_position: 6
---

# Test Groups

While Autometa can be run entirely with Global steps, it may be desireable
to provide specific implementations for some scenarios. For example, step texts
that have high potential for conflict due to same text but different intended
behavior, or scenarios which have edge cases for the same text.

The available groups are `Feature`, `Rule` and `ScenarioOutline` with the test type being `Scenario`.

By default, Autometa will assemble all rules, scenarios and outlines from
global steps, but they can be explicitely overwritten. When overwritten, not
every step in that group needs to be defined. If there are 5 steps, and 4 are valid global steps, then only one step need be defined in the test group.

```ts
import {
  Feature,
  Rule,
  ScenarioOutline,
  Scenario,
  Pass,
} from "@autometa/cucumber-runner";

Feature(() => {
  Scenario("override this scenario", () => {
    Given("override this specific step", Pass);
  });
  Rule("override this rule", () => {
    ScenarioOutline("override this scenarioOutline", () => {
      Given("a step unique to this outline", Pass);
    });
  });
}, "./my-feature.ts");
```
