---
sidebar_position: 3
---

import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";

# From scratch: build an Autometa test suite

This guide shows the minimum structure you need to start authoring `.feature` files and step definitions with Autometa, then run them in your chosen test runner. For complete, runnable references, see the example projects in `examples/` (they act as living documentation and integration tests).

## 1) Pick a project shape (flat vs app/group)

Autometa supports both a single “flat” suite and a monorepo-friendly **app/group** model. You can start flat and migrate later.

<Tabs groupId="project-shape" defaultValue="flat" values={[{label: "Flat", value: "flat"},{label: "App/Group", value: "groups"}]}>

<TabItem value="flat">

### Flat (one app, one world, one steps environment)

Good when you have one system under test and want the simplest mental model.

```text title="Suggested layout"
features/
  health.feature
src/
  step-definitions.ts
  steps/
    common.steps.ts
autometa.config.ts
```

```ts title="autometa.config.ts"
import { defineConfig } from "@autometa/config";

export default defineConfig({
  default: {
    // "vitest" | "jest" | "playwright"
    runner: "vitest",
    roots: {
      features: ["./features/**/*.feature"],
      steps: ["./src/steps", "./src/step-definitions.ts"],
    },
  },
});
```

</TabItem>

<TabItem value="groups">

### App/Group (one steps environment per app/API)

Good for monorepos (Nx/Nest workspaces, multiple APIs/apps) where each group can have its own **world** and **app composition root**.

```text title="Suggested layout"
src/
  autometa/
    base-runner.ts
    root.steps.ts
  groups/
    brew-buddy/
      autometa.steps.ts
      menu/
        .features/
          menu.feature
        steps/
          menu.steps.ts
autometa.config.ts
```

```ts title="autometa.config.ts (minimal group registry)"
import { defineConfig } from "@autometa/config";

export default defineConfig({
  default: {
    runner: "vitest",
    roots: {
      // Hoisted features (optional). Module features come from `modules.relativeRoots.features`.
      features: ["src/features/**/*.feature"],
      steps: ["src/autometa/root.steps.ts", "src/groups/**/autometa.steps.ts"],
    },
    modules: {
      // Optional, but recommended when you have lots of modules/steps
      stepScoping: "scoped",
      relativeRoots: {
        features: [".features/**/*.feature"],
        steps: ["steps/**/*.steps.ts"],
      },
      groups: {
        "brew-buddy": {
          root: "src/groups/brew-buddy",
          modules: ["menu"],
        },
      },
    },
  },
});
```

See [Monorepos: groups, modules, and isolated worlds](monorepos) for the full model (including module selection via `autometa run -g/-m`).

</TabItem>

</Tabs>

## 2) Create a step entrypoint (`stepsEnvironment`)

Your test runner (and `autometa run`) needs a discoverable export called `stepsEnvironment`. This is the object that provides `Given/When/Then`, hooks, `ensure(...)`, and (optionally) decorator bindings.

```ts title="src/step-definitions.ts"
import { CucumberRunner } from "@autometa/runner";

export interface World {
  readonly state: Record<string, unknown>;
}

const runner = CucumberRunner.builder<World>().withWorld({ state: {} });

export const stepsEnvironment = runner.steps();

export const { Given, When, Then, BeforeScenario, AfterScenario, ensure } =
  stepsEnvironment;
```

If you plan to use decorators, you also need `reflect-metadata` and `runner.bindingsTS()`:

```ts title="src/step-definitions.ts (decorators)"
import "reflect-metadata";
import { CucumberRunner, WORLD_TOKEN } from "@autometa/runner";

export interface World {
  readonly state: Record<string, unknown>;
}

const runner = CucumberRunner.builder<World>().withWorld({ state: {} });

export const stepsEnvironment = runner.steps();
export const { ensure } = stepsEnvironment;

export const { Binding, Given: GivenDecorator, Inject } = runner.bindingsTS();
export { WORLD_TOKEN };
```

## 3) Author steps: `Given(...)` vs `@Given(...)`

Autometa supports both top-level function steps and decorator-based steps. The underlying expression matching is the same; the difference is *where registration happens*.

<Tabs groupId="step-style" defaultValue="functions" values={[{label: "Functions", value: "functions"},{label: "Decorators", value: "decorators"}]}>

<TabItem value="functions">

```ts title="src/steps/common.steps.ts"
import { Given, ensure } from "../step-definitions";

Given("the API is healthy", async (world) => {
  world.state.health = "ok";
  ensure(world.state.health).toStrictEqual("ok");
});
```

</TabItem>

<TabItem value="decorators">

```ts title="src/steps/common.steps.ts"
import {
  Binding,
  GivenDecorator as Given,
  Inject,
  WORLD_TOKEN,
  ensure,
} from "../step-definitions";
import type { World } from "../step-definitions";

@Binding()
export class CommonSteps {
  constructor(@Inject(WORLD_TOKEN) private readonly world: World) {}

  @Given("the API is healthy")
  async apiIsHealthy(): Promise<void> {
    this.world.state.health = "ok";
    ensure(this.world.state.health).toStrictEqual("ok");
  }
}
```

</TabItem>

</Tabs>

## 4) Run the suite

- If you want runner-specific wiring (Vitest/Jest/Playwright), follow [Installation](installation) and [Runners & loaders](runners).
- If you prefer a single entrypoint, install `@autometa/cli` and use `autometa run` (details in [Authoring executors & steps](authoring)).
