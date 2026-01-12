---
sidebar_position: 6
---

# Step runtime helpers & pickle metadata

This reference explains how Autometa exposes per-step runtime data (tables, docstrings, and metadata) and how pickles represent compiled Gherkin scenarios with location info.

## Accessing runtime helpers

Autometa creates a `StepRuntimeHelpers` instance for each step execution. You can access it in two ways:

1) **Explicit parameter injection** (recommended when you need tables/docstrings).
2) **`world.runtime`** (convenient when you want to keep the signature lean).

### Signature and injection order

Runtime helpers are injected *after* expression arguments and *before* the world:

```ts title="src/steps/boarding.steps.ts"
import type { StepRuntimeHelpers } from "@autometa/executor";
import { Given } from "../step-definitions";

Given("the flight has {int} passengers", (count: number, runtime: StepRuntimeHelpers, world) => {
  world.state.passengerCount = count;
  world.state.stepLine = runtime.currentStep?.step?.source?.line ?? null;
});
```

If you omit the runtime parameter, the world is still the last argument:

```ts title="src/steps/boarding.steps.ts"
import { Given } from "../step-definitions";

Given("the boarding gate is ready", (world) => {
  const runtime = world.runtime;
  if (runtime?.hasDocstring) {
    world.state.note = runtime.consumeDocstring();
  }
});
```

`world.runtime` is a non-enumerable property that is resolved on demand. Do not store it outside the scope of the current step or hook.

## Docstrings

Docstrings are attached to steps using triple quotes:

```gherkin
Given the manifest is recorded
  """
  flight: SP-102
  captain: Aster
  """
```

Read them via `getDocstring()` or `consumeDocstring()`:

```ts title="src/steps/manifest.steps.ts"
import { Given } from "../step-definitions";

Given("the manifest is recorded", (runtime, world) => {
  const raw = runtime.getDocstring();
  if (!raw) return;
  world.state.manifest = raw.trim().split("\n");
});
```

Use `consumeDocstring()` if you want to clear it after processing:

```ts title="src/steps/payload.steps.ts"
import { Given } from "../step-definitions";

Given("the payload is prepared", (runtime, world) => {
  const raw = runtime.consumeDocstring();
  world.state.payload = raw ? JSON.parse(raw) : null;
});
```

### Docstring media types and transformers

Docstrings can declare a media type after the opening delimiter:

```gherkin
Given the request payload is defined
  """json
  { "priority": "high" }
  """
```

Autometa preserves that value and exposes it during the step:

- `runtime.getDocstringMediaType()`
- `runtime.getDocstringInfo()` → `{ content, mediaType? }`

You can register docstring transformers and parse docstrings automatically:

```ts title="src/step-definitions.ts"
import { configureStepDocstrings } from "@autometa/runner";

configureStepDocstrings({
  transformers: {
    json: (raw) => JSON.parse(raw),
    "application/json": (raw) => JSON.parse(raw),
  },
});
```

Transformer keys are matched against the docstring media type after basic normalization (trim, lowercase, remove `; charset=...`). Autometa also tries common shorthands, so a transformer registered as `json` will match `application/json`, and `+json` can be used to match vendor types like `application/vnd.api+json`.

```ts title="src/steps/payload.steps.ts"
import { Given } from "../step-definitions";

Given("the request payload is defined", (runtime, world) => {
  world.state.payload = runtime.consumeDocstringTransformed();
});
```

If no transformer matches, `getDocstringTransformed()` falls back to the raw string. To require a transformer, pass `fallback: "throw"`:

```ts
runtime.getDocstringTransformed({ fallback: "throw" });
```

## Data tables

Tables are attached immediately under the step text:

```gherkin
When the crew roster is loaded
  | name  | role  |
  | Ada   | pilot |
  | Quinn | ops   |
```

### Horizontal tables (headers in the first row)

```ts title="src/steps/crew.steps.ts"
import { When } from "../step-definitions";

When("the crew roster is loaded", (runtime, world) => {
  const table = runtime.requireTable("horizontal");
  world.state.crew = table.records();
});
```

### Vertical tables (headers in the first column)

```gherkin
Then the environment is configured
  | key    | value |
  | region | us-east |
  | retries | 3 |
```

```ts title="src/steps/env.steps.ts"
import { Then } from "../step-definitions";

Then("the environment is configured", (runtime, world) => {
  const table = runtime.requireTable("vertical");
  world.state.env = table.getRecord(0);
});
```

### Headerless tables (raw rows only)

```gherkin
And the boarding zones are set
  | A |
  | B |
  | C |
```

```ts title="src/steps/boarding.steps.ts"
import { And } from "../step-definitions";

And("the boarding zones are set", (runtime, world) => {
  const table = runtime.requireTable("headerless");
  world.state.zones = table.rows().map((row) => row[0]);
});
```

### Matrix tables (row + column headers)

```gherkin
When the bay occupancy grid is updated
  | bay | A | B | C |
  | 1   | 1 | 0 | 0 |
  | 2   | 0 | 1 | 1 |
```

```ts title="src/steps/bay.steps.ts"
import { When } from "../step-definitions";

When("the bay occupancy grid is updated", (runtime, world) => {
  const table = runtime.requireTable("matrix");
  world.state.occupancy = table.getCell("2", "B");
});
```

### Read modes and clearing behavior

- `getTable(...)` reads without clearing the table.
- `consumeTable(...)` reads and clears the table.
- `requireTable(...)` reads and throws if no table is attached.
- `getRawTable()` returns the raw `string[][]` table.

## Coercion and transformers

By default, primitive coercion is **enabled** for `horizontal`, `vertical`, and `matrix` tables, and **disabled** for `headerless` tables. You can override this per call and add transformers:

```ts title="src/steps/crew.steps.ts"
const table = runtime.requireTable("horizontal", {
  coerce: false,
  transformers: {
    age: (value) => Number.parseInt(value, 10),
  },
});
```

You can also adjust default coercion globally:

```ts title="src/step-definitions.ts"
import { configureStepTables } from "@autometa/runner";

configureStepTables({
  coercePrimitives: {
    headerless: true,
  },
});
```

## Step metadata (source refs, definitions, outline examples)

`StepRuntimeHelpers` exposes step metadata in two forms:

- `runtime.currentStep` (getter)
- `runtime.getStepMetadata()` (method)

Metadata includes the feature/scenario/outline/example context, the matched step definition, and source refs (`file`, `line`, `column`) where available.

```ts title="src/steps/telemetry.steps.ts"
import { Then } from "../step-definitions";

Then("the telemetry is logged", (runtime, world) => {
  const metadata = runtime.currentStep;
  const source = metadata?.step?.source;
  const example = metadata?.example;

  world.state.location = source?.file && source.line
    ? `${source.file}:${source.line}`
    : null;

  world.state.exampleValues = example?.values ?? null;
});
```

The metadata structure is:

```ts title="StepRuntimeMetadata"
export interface StepRuntimeMetadata {
  readonly feature?: { name: string; keyword: string; uri?: string; source?: SourceRef };
  readonly scenario?: { name: string; keyword: string; source?: SourceRef };
  readonly outline?: { name: string; keyword: string; source?: SourceRef };
  readonly example?: { name?: string; index: number; values: Readonly<Record<string, string>>; source?: SourceRef };
  readonly step?: { keyword?: string; text?: string; source?: SourceRef };
  readonly definition?: { keyword: StepKeyword; expression: StepExpression; source?: SourceRef };
}
```

`SourceRef` points back to the Gherkin file when the runner can supply it:

```ts
export interface SourceRef {
  readonly file?: string;
  readonly line?: number;
  readonly column?: number;
}
```

## Pickles (compiled scenarios + location data)

Pickles represent compiled, executable scenarios (including background steps). They are generated by `@autometa/gherkin` and used internally by the executor and event system.

```ts title="SimplePickle"
export interface SimplePickle {
  id: string;
  name: string;
  language: string;
  steps: SimplePickleStep[];
  tags: string[];
  uri?: string;
  feature: SimplePickleFeatureRef;
  scenario: SimplePickleScenarioRef;
  rule?: SimplePickleRuleRef;
}
```

```ts title="SimplePickleStep"
export interface SimplePickleStep {
  id: string;
  text: string;
  keyword: string;
  keywordType: string;
  type: "context" | "action" | "outcome";
  location: { line: number; column: number };
  comments?: string[];
  dataTable?: string[][];
  docString?: string;
  docStringMediaType?: string;
  astNodeIds: string[];
  scenario: SimplePickleScenarioRef;
  feature: SimplePickleFeatureRef;
  rule?: SimplePickleRuleRef;
  tags: string[];
  uri?: string;
  language: string;
}
```

```ts title="Pickle refs"
export interface SimplePickleFeatureRef {
  id: string;
  name: string;
  location: { line: number; column: number };
  tags: string[];
  comments?: string[];
}

export interface SimplePickleScenarioRef {
  id: string;
  name: string;
  location: { line: number; column: number };
  tags: string[];
  comments?: string[];
  type: "scenario" | "scenario_outline" | "background";
}

export interface SimplePickleRuleRef {
  id: string;
  name: string;
  location: { line: number; column: number };
  tags: string[];
  comments?: string[];
}
```

Pickle entries are useful for:

- building reporters that link to exact step locations
- reconstructing background steps in step timelines
- inspecting which Gherkin nodes were compiled for a scenario outline example

If you only need location info inside steps, use `runtime.currentStep?.step?.source` instead of parsing pickles directly.
