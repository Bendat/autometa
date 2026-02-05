---
sidebar_position: 4
---

# Monorepos: groups, modules, and isolated worlds

Autometa supports monorepo-style test suites by letting you:

- Keep a shared baseline (common steps + shared world parts).
- Split **world + app** per “thing under test” (apps, APIs, bounded contexts).
- Run only a subset via the CLI (`-g/--group` and `-m/--module`).

This page maps to the patterns in `examples/modules-examples`.

## 1) Choose your layout

### Monolithic (one app, one world)

- One `stepsEnvironment` for everything.
- A single world shape + composition root.
- Simplest setup; good for one API/app.

### App-based (group per app/API)

- One `stepsEnvironment` per app via `baseRunner.group("<group>")`.
- Each group can extend the world shape and wire its own `App.compositionRoot(...)`.
- Great for Nx/Nest monorepos where each app is a separate API.

### Use-case based (modules within a group)

- Keep one group per app, then split features/steps into modules like `orders`, `reports`, `orders/cancellations`.
- Optional step visibility scoping (`modules.stepScoping: "scoped"`) so a feature only “sees” root + its group + its module steps.
- Great when one app has many bounded contexts and you want isolated vocabularies.

## 2) Isolate worlds and apps with `group(...)`

Start with a minimal shared world + a derivable runner:

```ts title="src/autometa/base-runner.ts"
import { CucumberRunner } from "@autometa/runner";

export interface BaseWorld {
  readonly state: Record<string, unknown>;
}

export const baseRunner = CucumberRunner.builder<BaseWorld>()
  .withWorld({ state: {} })
  .derivable();
```

Create one steps environment per group (app):

```ts title="src/groups/brew-buddy/autometa.steps.ts"
import { App } from "@autometa/runner";
import { baseRunner } from "../../autometa/base-runner";
import { BrewBuddyApp } from "./app";
import type { BrewBuddyWorld } from "./world";

const runner = baseRunner
  .group("brew-buddy")
  .extendWorld<BrewBuddyWorld>({ brewBuddy: { seen: [] } })
  .extendApp(App.compositionRoot(BrewBuddyApp, { deps: [] }));

export const stepsEnvironment = runner.steps();
```

The CLI loads all step modules, then picks the right `stepsEnvironment` for each feature by group.

## 3) Add modules for targeted runs (and scoped steps)

Configure module roots and declarations in `autometa.config.ts`:

```ts title="autometa.config.ts"
export default defineConfig({
  default: {
    roots: {
      features: ["src/features/**/*.feature"], // hoisted features (optional)
      steps: ["src/autometa/root.steps.ts", "src/groups/**/autometa.steps.ts"],
    },
    modules: {
      stepScoping: "scoped",
      relativeRoots: {
        features: [".features/**/*.feature"],
        steps: ["steps/**/*.steps.ts"],
      },
      groups: {
        backoffice: {
          root: "src/groups/backoffice",
          modules: ["reports", { name: "orders", submodules: ["cancellations"] }],
        },
      },
    },
  },
});
```

With this shape, Autometa can:

- Expand `relativeRoots` into real `roots.*` entries under each selected module directory.
- Filter module expansion via the CLI (`-g/-m`).
- Scope step visibility by file location when `stepScoping: "scoped"`.

## 4) Scoping hoisted features into a module

If a feature file lives outside any group/module folder (“hoisted”), you can still opt into scoped steps.

```gherkin
@scope(backoffice:reports)
Feature: ...
```

That matches the tag parser used by the CLI (`@scope:<...>`, `@scope=<...>`, or `@scope(<...>)`).

### Hoisted feature scoping modes

By default, hoisted features **must** declare scope via `@scope(...)`. You can configure this:

```ts title="autometa.config.ts"
export default defineConfig({
  default: {
    modules: {
      hoistedFeatures: {
        // "tag" (default): hoisted features need @scope(...)
        // "directory": infer group/module from the feature's directory under roots.features
        scope: "tag",
        // When true (default), error if inference doesn't match a declared group/module
        strict: true,
      },
    },
  },
});
```

Note: `@scope(<group>)` assigns the feature to a group, but it does **not** intentionally “downgrade” a feature that already lives under a module directory (path-based module inference still applies).

## 5) CLI workflow

See `Reference → CLI` for full syntax, but the common monorepo flows are:

```bash
# Run everything in a group (often "an app")
autometa run -g backoffice

# Run one module in a group (unambiguous suffix)
autometa run -g backoffice -m reports

# Run a deep module (exact id)
autometa run -m backoffice:orders:cancellations
```

If you also pass explicit feature patterns, note that `-g/-m` affects module/step loading but does not automatically rewrite your patterns.
