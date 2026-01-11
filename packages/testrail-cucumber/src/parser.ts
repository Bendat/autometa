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

function collectBackgroundSteps(children: readonly any[]): StepNode[] {
  const steps: StepNode[] = [];
  for (const child of children) {
    if (child.background) {
      steps.push(...mapSteps(child.background.steps ?? []));
    }
  }
  return steps;
}

function toScenario(scenario: any, backgroundSteps: StepNode[]): ScenarioNode | ScenarioOutlineNode {
  const base = {
    name: scenario.name,
    line: scenario.location?.line ?? undefined,
    description: scenario.description ?? undefined,
    tags: scenario.tags?.map((t: any) => t.name) ?? [],
    steps: mapSteps(scenario.steps ?? []),
    backgroundSteps,
  };

  const isOutline = (scenario.examples?.length ?? 0) > 0;

  if (!isOutline) {
    return {
      kind: "scenario",
      ...base,
    } satisfies ScenarioNode;
  }

  const examples: OutlineExampleTable[] = (scenario.examples ?? []).map((ex: any) => ({
    headers: (ex.tableHeader?.cells ?? []).map((c: any) => c.value),
    rows: (ex.tableBody ?? []).map((row: any) => (row.cells ?? []).map((c: any) => c.value)),
  }));

  return {
    kind: "outline",
    examples,
    ...base,
  } satisfies ScenarioOutlineNode;
}

function mapSteps(steps: readonly any[]): StepNode[] {
  return steps.map((s: any) => ({
    keyword: s.keyword?.trimEnd?.() ?? "",
    text: s.text ?? "",
    ...(s.dataTable
      ? {
          table: {
            headers: (s.dataTable.rows?.[0]?.cells ?? []).map((c: any) => String(c.value)),
            rows: (s.dataTable.rows ?? [])
              .slice(1)
              .map((row: any) => (row.cells ?? []).map((c: any) => String(c.value))),
          },
        }
      : {}),
  }));
}
