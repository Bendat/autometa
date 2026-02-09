---
sidebar_position: 6
---

# Step runtime helpers & pickle metadata

This reference explains how Autometa exposes per-step runtime data (tables, docstrings, and metadata) and how pickles represent compiled Gherkin scenarios with location info.

## Accessing runtime helpers

Autometa creates a `StepRuntimeHelpers` instance for each step execution. Access it through `world.runtime`:

```ts title="src/steps/boarding.steps.ts"
import { Given } from "../step-definitions";

Given("the boarding gate is ready", (world) => {
  if (world.runtime.hasDocstring) {
    world.state.note = world.runtime.consumeDocstring();
  }
});
```

When you have expression arguments, they come before the world:

```ts title="src/steps/boarding.steps.ts"
import { Given } from "../step-definitions";

Given("the flight has {int} passengers", (count: number, world) => {
  world.state.passengerCount = count;
  world.state.stepLine = world.runtime.currentStep?.step?.source?.line ?? null;
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

Given("the manifest is recorded", (world) => {
  const raw = world.runtime.getDocstring();
  if (!raw) return;
  world.state.manifest = raw.trim().split("\n");
});
```

Use `consumeDocstring()` if you want to clear it after processing:

```ts title="src/steps/payload.steps.ts"
import { Given } from "../step-definitions";

Given("the payload is prepared", (world) => {
  const raw = world.runtime.consumeDocstring();
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

Given("the request payload is defined", (world) => {
  world.state.payload = world.runtime.consumeDocstringTransformed();
});
```

If no transformer matches, `getDocstringTransformed()` falls back to the raw string. To require a transformer, pass `fallback: "throw"`:

```ts
world.runtime.getDocstringTransformed({ fallback: "throw" });
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

When("the crew roster is loaded", (world) => {
  const table = world.runtime.requireTable("horizontal");
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

Then("the environment is configured", (world) => {
  const table = world.runtime.requireTable("vertical");
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

And("the boarding zones are set", (world) => {
  const table = world.runtime.requireTable("headerless");
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

When("the bay occupancy grid is updated", (world) => {
  const table = world.runtime.requireTable("matrix");
  world.state.occupancy = table.getCell("2", "B");
});
```

### Read modes and clearing behavior

- `getTable(...)` reads without clearing the table.
- `consumeTable(...)` reads and clears the table.
- `requireTable(...)` reads and throws if no table is attached.
- `getRawTable()` returns the raw `string[][]` table.

## Coercion and transformers

### Primitive coercion

By default, primitive coercion is **enabled** for `horizontal`, `vertical`, and `matrix` tables, and **disabled** for `headerless` tables. Coercion automatically converts string values to their primitive types:

- `"true"` / `"false"` → `boolean`
- `"123"` → `number`
- `"null"` → `null`
- `"undefined"` → `undefined`

You can override coercion per call:

```ts
const table = world.runtime.requireTable("horizontal", { coerce: false });
```

Or adjust defaults globally:

```ts title="src/step-definitions.ts"
import { configureStepTables } from "@autometa/runner";

configureStepTables({
  coercePrimitives: {
    headerless: true,  // Enable coercion for headerless tables
  },
});
```

### Table transformers

Transformers let you customize how cell values are parsed before they reach your step code. They run **before** primitive coercion, giving you full control over the final value type.

#### Transformer signature

```ts
type TableTransformer = (value: string, context: CellContext) => unknown;
```

Each transformer receives:
- `value`: The raw string from the table cell
- `context`: Cell context including shape + coordinates (and headers when applicable)

`CellContext` provides enough metadata to write shape-aware transformers:

```ts
export interface CellContext {
  readonly shape: "horizontal" | "vertical" | "headerless" | "matrix";
  readonly rowIndex: number;
  readonly columnIndex: number;
  /**
   * Header name for:
   * - horizontal/vertical tables
   * - matrix column headers
   */
  readonly header?: string;
  /** Row header for matrix tables. */
  readonly verticalHeader?: string;
  /** The original, unmodified cell value. */
  readonly raw: string;
}
```

Notes:

- In **horizontal** tables, `rowIndex` is the 0-based record row (excluding the header row) and `columnIndex` is the 0-based header index.
- In **vertical** tables, `rowIndex` is the 0-based header index (down the first column) and `columnIndex` is the 0-based record index (across).
- In **headerless** tables, `rowIndex` / `columnIndex` are the 0-based raw table coordinates.
- In **matrix** tables, `verticalHeader` is the row header, `header` is the column header, and indices are 0-based within their respective header lists.

#### Horizontal and vertical table transformers

For horizontal and vertical tables, transformers are keyed by **header name**.

If you want your table to map cleanly onto JSON field names (and get nicer autocomplete), you can provide an explicit `keys` mapping. When `keys` is present, Autometa will:

- use the mapped key in `table.records()` / `table.getRow(...)` output
- resolve transformers by mapped key (with fallback to the raw header name)
- allow lookups like `table.getCell("reportsTo", 0)`

```ts title="src/steps/crew.steps.ts"
const table = world.runtime.requireTable("horizontal", {
  transformers: {
    age: (value) => Number.parseInt(value, 10),
    hiredAt: (value) => new Date(value),
    isActive: (value) => value.toLowerCase() === "yes",
    roles: (value) => value.split(",").map(r => r.trim()),
  },
});

// Vertical tables use the same header-keyed shape, but the header names come
// from the first column (e.g. "region", "retries" in a key/value table).
world.runtime.requireTable("vertical", {
  transformers: {
    retries: (value) => Number(value),
  },
});

// Optional: map raw headers to record keys
world.runtime.requireTable("horizontal", {
  keys: {
    "Reports To": "reportsTo",
    "Start Date": "startDate",
  } as const,
  transformers: {
    reportsTo: (value) => value.trim(),
    startDate: (value) => new Date(value),
  },
});

// You can also pass a class (or instance) as the second argument.
class MyTableTransform {
  readonly keys = {
    "Reports To": "reportsTo",
    "Start Date": "startDate",
  } as const;
  readonly transformers = {
    reportsTo: (value: string) => value.trim(),
    startDate: (value: string) => new Date(value),
  };
}

world.runtime.requireTable("horizontal", MyTableTransform);
world.runtime.requireTable("horizontal", new MyTableTransform());
```

You can also use a static getter pattern to keep row shape + table options in one place.
Autometa does not read static members automatically, so pass the getter result explicitly:

```ts title="src/steps/inventory.steps.ts"
class InventoryRow {
  item = "";
  quantity = 0;

  static get table() {
    return {
      keys: {
        Item: "item",
        Quantity: "quantity",
      } as const,
      transformers: {
        quantity: (value: string) => Number.parseInt(value, 10),
      },
    };
  }
}

const table = world.runtime.requireTable("horizontal", InventoryRow.table);
const rows = table.asInstances(InventoryRow);
```

If you want to keep the `asInstances(...)` header mapping on the class, use a second getter:

```ts
class InventoryRow {
  item = "";
  quantity = 0;

  static get headerMap() {
    return { Item: "item", Quantity: "quantity" } as const;
  }
}

const table = world.runtime.requireTable("horizontal");
const rows = table.asInstances(InventoryRow, { headerMap: InventoryRow.headerMap });
```

Given this table:

```gherkin
| name  | age | hiredAt    | isActive | roles          |
| Alice | 28  | 2020-01-15 | yes      | dev,lead       |
| Bob   | 32  | 2019-06-01 | no       | qa,automation  |
```

The records will have properly typed values:

```ts
const records = table.records();
// records[0].age is number 28
// records[0].hiredAt is Date object
// records[0].isActive is boolean true
// records[0].roles is string[] ["dev", "lead"]
```

#### Headerless table transformers

For headerless tables, transformers are keyed by **column index** (0-based):

```ts title="src/steps/zones.steps.ts"
const table = world.runtime.requireTable("headerless", {
  transformers: {
    0: (value) => value.toUpperCase(),      // First column
    1: (value) => Number(value),            // Second column
    2: (value) => value === "active",       // Third column
  },
});
```

Given this table:

```gherkin
| a | 100 | active   |
| b | 200 | inactive |
| c | 150 | active   |
```

Each row will have transformed values:

```ts
const rows = table.rows();
// rows[0] is ["A", 100, true]
// rows[1] is ["B", 200, false]
```

#### Matrix table transformers

Matrix tables support the most flexible transformation options. You can transform by row header, column header, or specific cells:

```ts title="src/steps/grid.steps.ts"
const table = world.runtime.requireTable("matrix", {
  transformers: {
    // Transform all values in specific rows
    rows: {
      // Row transformers apply to every cell in that row.
      // If you only want to transform some columns, branch on context.header.
      "Row2": (value) => {
        const numeric = Number(value);
        return Number.isNaN(numeric) ? value : numeric;
      },
    },
    // Transform all values in specific columns
    columns: {
      "ColA": (value) => value.toUpperCase(),
    },
    // Transform specific cells (most specific, highest priority)
    cells: {
      "Row1": {
        "ColB": (value) => Number(value) * 2,  // Double this specific cell
      },
    },
  },
});
```

You can also map row/column headers to JSON keys using `keys`:

```ts title="src/steps/grid.steps.ts"
world.runtime.requireTable("matrix", {
  keys: {
    rows: { "Row1": "row1", "Row2": "row2" },
    columns: { "Reports To": "reportsTo", "Team Size": "teamSize" },
  } as const,
  transformers: {
    rows: {
      row2: (value) => value.toUpperCase(),
    },
    columns: {
      teamSize: (value) => Number(value),
    },
    cells: {
      row1: {
        reportsTo: (value) => value.trim(),
      },
    },
  },
});
```

Given this table:

```gherkin
| grid | ColA | ColB | ColC |
| Row1 | abc  | 10   | 20   |
| Row2 | def  | 30   | 40   |
```

Transformers are applied with this priority:
1. **Cell-specific** (`cells`) - highest priority
2. **Row** (`rows`)
3. **Column** (`columns`)
4. Primitive coercion (if enabled and no transformer matched)

```ts
table.getCell("Row1", "ColA");  // "ABC" (column transformer)
table.getCell("Row1", "ColB");  // 20 (cell-specific: 10 * 2)
table.getCell("Row2", "ColA");  // "def" (row transformer overrides column)
table.getCell("Row2", "ColB");  // 30 (row transformer)
```

### Common transformer patterns

#### Parsing enums

```ts
transformers: {
  status: (value) => {
    const statuses = { active: "ACTIVE", pending: "PENDING", closed: "CLOSED" };
    return statuses[value.toLowerCase()] ?? value;
  },
}
```

#### Parsing nullable values

```ts
transformers: {
  optionalField: (value) => value === "-" ? null : value,
}
```

#### Complex objects

```ts
transformers: {
  metadata: (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return { raw: value };
    }
  },
}
```

#### Using context for conditional logic

```ts
transformers: {
  amount: (value, context) => {
    // Access row/column info from context if needed
    const numeric = Number(value);
    return isNaN(numeric) ? 0 : numeric;
  },
}
```

### Combining transformers with coercion

Transformers run **before** coercion. If a transformer returns a string, coercion (if enabled) will still attempt to convert it:

```ts
const table = world.runtime.requireTable("horizontal", {
  coerce: true,  // Enabled by default for horizontal tables
  transformers: {
    // This transformer returns a string, so "123" becomes number 123 via coercion
    code: (value) => value.trim(),
  },
});
```

To prevent coercion after transformation, either:
- Return a non-string type from your transformer
- Disable coercion: `coerce: false`

## Step metadata (source refs, definitions, outline examples)

`world.runtime` exposes step metadata in two forms:

- `world.runtime.currentStep` (getter)
- `world.runtime.getStepMetadata()` (method)

Metadata includes the feature/scenario/outline/example context, the matched step definition, and source refs (`file`, `line`, `column`) where available.

```ts title="src/steps/telemetry.steps.ts"
import { Then } from "../step-definitions";

Then("the telemetry is logged", (world) => {
  const metadata = world.runtime.currentStep;
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
