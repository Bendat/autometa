import { AstBuilder, GherkinClassicTokenMatcher, Parser } from "@cucumber/gherkin";
import { IdGenerator } from "@cucumber/messages";
import {
  FeatureChildNode,
  ParsedFeature,
  ScenarioNode,
  ScenarioOutlineNode,
  StepNode,
  OutlineExampleTable,
} from "./types";

const uuidFn = IdGenerator.uuid();
const builder = new AstBuilder(uuidFn);
const matcher = new GherkinClassicTokenMatcher();
const parser = new Parser(builder, matcher);
parser.stopAtFirstError = true;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

export function parseFeature(text: string, featurePath: string): ParsedFeature {
  const gherkinDocument = parser.parse(text);
  const feature = gherkinDocument.feature;
  if (!feature) {
    throw new Error("No feature found in document");
  }

  const backgroundSteps = collectBackgroundSteps(feature.children ?? []);
  const children: FeatureChildNode[] = [];

  for (const child of feature.children ?? []) {
    if (child.scenario && !child.rule) {
      const parsed = toScenario(child.scenario, backgroundSteps);
      if (parsed.kind === "scenario") {
        children.push(parsed);
      } else {
        children.push(parsed);
      }
    }
    if (child.rule) {
      const ruleBg = collectBackgroundSteps(child.rule.children ?? []);
      for (const ruleChild of child.rule.children ?? []) {
        if (ruleChild.scenario) {
          const parsed = toScenario(ruleChild.scenario, [...backgroundSteps, ...ruleBg]);
          children.push(parsed);
        }
      }
    }
  }

  return {
    name: feature.name,
    description: feature.description ?? undefined,
    tags: feature.tags?.map((t) => t.name) ?? [],
    backgroundSteps,
    children,
    path: featurePath,
  };
}

function collectBackgroundSteps(children: readonly unknown[]): StepNode[] {
  const steps: StepNode[] = [];
  for (const child of children) {
    const record = asRecord(child);
    const background = record.background;
    if (background) {
      const backgroundRecord = asRecord(background);
      steps.push(...mapSteps(asArray(backgroundRecord.steps)));
    }
  }
  return steps;
}

function toScenario(scenario: unknown, backgroundSteps: StepNode[]): ScenarioNode | ScenarioOutlineNode {
  const record = asRecord(scenario);

  const tags = asArray(record.tags)
    .map((tag) => String(asRecord(tag).name ?? ""))
    .filter((tag) => tag.length > 0);

  const base = {
    name: String(record.name ?? ""),
    line: (() => {
      const line = asRecord(record.location).line;
      return typeof line === "number" ? line : undefined;
    })(),
    description: typeof record.description === "string" ? record.description : undefined,
    tags,
    steps: mapSteps(asArray(record.steps)),
    backgroundSteps,
  };

  const isOutline = asArray(record.examples).length > 0;

  if (!isOutline) {
    return {
      kind: "scenario",
      ...base,
    } satisfies ScenarioNode;
  }

  const examples: OutlineExampleTable[] = asArray(record.examples).map((ex) => {
    const example = asRecord(ex);
    const tableHeader = asRecord(example.tableHeader);
    const headers = asArray(tableHeader.cells).map((cell) => String(asRecord(cell).value ?? ""));
    const rows = asArray(example.tableBody).map((row) =>
      asArray(asRecord(row).cells).map((cell) => String(asRecord(cell).value ?? ""))
    );
    return { headers, rows };
  });

  return {
    kind: "outline",
    examples,
    ...base,
  } satisfies ScenarioOutlineNode;
}

function mapSteps(steps: readonly unknown[]): StepNode[] {
  return steps.map((step) => {
    const record = asRecord(step);
    const keyword = typeof record.keyword === "string" ? record.keyword : "";
    const text = typeof record.text === "string" ? record.text : "";

    const dataTable = record.dataTable;
    if (!dataTable) {
      return { keyword: keyword.trimEnd(), text };
    }

    const tableRecord = asRecord(dataTable);
    const rows = asArray(tableRecord.rows);
    const headerRow = rows[0];
    const headers = asArray(asRecord(headerRow).cells).map((cell) => String(asRecord(cell).value ?? ""));
    const bodyRows = rows
      .slice(1)
      .map((row) => asArray(asRecord(row).cells).map((cell) => String(asRecord(cell).value ?? "")));

    return {
      keyword: keyword.trimEnd(),
      text,
      table: {
        headers,
        rows: bodyRows,
      },
    };
  });
}
