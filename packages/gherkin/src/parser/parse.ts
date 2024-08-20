import {
  Background as GherkinBackground,
  Feature as GherkinFeature,
  Rule as GherkinRule,
  Scenario as GherkinScenario,
  Tag,
  StepKeywordType,
  FeatureChild,
  RuleChild,
  TableCell,
} from "@cucumber/messages";
import { FeatureBuilder } from "../groups/feature";
import { Rule, RuleBuilder } from "../groups/rule";
import { ScenarioBuilder } from "../scenario";
import { ScenarioOutlineBuilder } from "../groups/scenario-outline";
import { ExamplesBuilder } from "../groups/examples";
import { GherkinDocString, StepBuilder, StepKeyword } from "../steps";
import { compileDataTable } from "../steps/datatables/compile-table-data";
import { Background, BackgroundBuilder } from "../background";
import {
  isBackground,
  isRule,
  isScenarioOutline,
  isScenario,
  notEmpty,
} from "./validators";
import { FeatureChildType, RuleChildType } from "./child-types";
import { Example, ExampleBuilder } from "../example";
import { AutomationError } from "@autometa/errors";
import { interpolateStepText } from "./interpolate-step-text";

export function convertToClass(feature: GherkinFeature, filePath: string) {
  return new FeatureBuilder()
    .name(feature.name)
    .description(feature.description)
    .keyword(feature.keyword.trim())
    .tags(new Set(buildTags(feature.tags)))
    .uri(filePath)
    .language(feature.language)
    .children(buildChildren(feature))
    .build();
}

export function buildChildren(
  feature: GherkinFeature,
  tags?: string[],
  backgrounds?: Background[]
): FeatureChildType[];
export function buildChildren(
  rule: GherkinRule,
  tags?: string[],
  backgrounds?: Background[]
): RuleChildType[];
export function buildChildren(
  featureOrRule: GherkinFeature | GherkinRule,
  tags?: string[],
  backgrounds?: Background[]
): FeatureChildType[] | RuleChildType[] {
  if (!tags) {
    tags = [];
    tags.push(...buildTags(featureOrRule.tags));
  }
  if (!backgrounds) {
    backgrounds = [];
  }
  return featureOrRule.children.map(makeChildren()).filter(notEmpty);

  function makeChildren() {
    return (child: FeatureChild | RuleChild) => {
      if (isBackground(child)) {
        if (!backgrounds) {
          backgrounds = [];
        }
        child.background.description;
        const bg = buildBackground(child);
        backgrounds.push(bg);
        return bg;
      }

      if (isRule(child)) {
        const ruleObject: Rule = buildRule(child, tags, backgrounds);
        if (backgrounds && backgrounds.length > 1) {
          backgrounds.pop();
        }
        return ruleObject;
      }

      if (isScenarioOutline(child)) {
        const { scenario } = child;
        const tagsNew = [...(tags ?? []), ...buildTags(scenario.tags)];
        return buildOutline(scenario, tagsNew);
      }

      if (isScenario(child)) {
        const { scenario } = child;
        const tagsNew = [...(tags ?? []), ...buildTags(scenario.tags)];
        return buildScenario(scenario, backgrounds, tagsNew);
      }
    };
  }
}

export function buildScenario(
  scenario: GherkinScenario,
  backgrounds: Background[] | undefined,
  tagsNew: string[]
) {
  const steps = makeSteps(scenario, undefined);
  const [bg1, bg2] = backgrounds ?? [];
  const scen = new ScenarioBuilder()
    .name(scenario.name)
    .description(scenario.description)
    .tags(new Set(tagsNew))
    .children(steps)
    .backgrounds([bg1, bg2])
    .keyword(scenario.keyword)
    .build();
  return scen;
}
export function buildOutline(scenario: GherkinScenario, tags: string[]) {
  const examples = buildExamples(scenario, tags);
  const outline = new ScenarioOutlineBuilder()
    .name(scenario.name)
    .tags(new Set(tags))
    .keyword(scenario.keyword.trim())
    .children(examples)
    .build();
  return outline;
}

export function buildBackground(child: { background: GherkinBackground }) {
  const { background } = child;
  const steps = makeSteps(background, undefined);
  const bg = new BackgroundBuilder()
    .name(background.name)
    .description(background.description)
    .keyword(background.keyword.trim())
    .children(steps)
    .build();
  return bg;
}

function makeSteps(
  background: GherkinBackground | GherkinScenario,
  example: Example | undefined
) {
  return background.steps.map((step) => {
    const doc = step.docString
      ? new GherkinDocString(step.docString)
      : undefined;
    return new StepBuilder()
      .text(step.text)
      .docstring(doc)
      .table(compileDataTable(step.dataTable, example))
      .keyword(step.keyword.trim() as StepKeyword)
      .keywordType(step.keywordType?.trim() as StepKeywordType)
      .build();
  });
}

export function buildRule(
  child: { rule: GherkinRule },
  tags: string[] | undefined,
  backgrounds: Background[] | undefined
) {
  const { rule } = child;
  const tagsNew = [...(tags ?? []), ...buildTags(rule.tags)];
  const ruleObject: Rule = new RuleBuilder()
    .name(rule?.name)
    .keyword(rule?.keyword.trim())
    .description(rule.description)
    .tags(new Set(tagsNew))
    .children(buildChildren(rule, tagsNew, backgrounds))
    .build();
  return ruleObject;
}

export function buildExamples(scenario: GherkinScenario, tagsNew: string[]) {
  return scenario.examples.map((example) => {
    const cellValue = (cell: TableCell) => cell.value;
    const titles = example.tableHeader?.cells.map(cellValue) ?? [];
    const values =
      example.tableBody.map((row) => row.cells.map(cellValue)) ?? [];

    const scenarios = values.map((row) => {
      const name = scenarioExampleTitle(titles, scenario.name, row);
      const exampleValues = titles
        .map((title, index) => {
          return { [title]: row[index] };
        })
        .reduce((old, current) => {
          return { ...old, ...current };
        }, {});
      const exampleBuilder = new ExampleBuilder()
        .name(name)
        .description(scenario.description)
        .keyword("Example")
        .table(exampleValues);

      const steps = makeSteps(scenario, exampleBuilder.build());
      steps.forEach((step) => {
        (step as { text: string }).text = interpolateStepText(
          step.text,
          exampleValues
        );
      });
      const tags = new Set([...tagsNew, ...buildTags(example.tags)]);
      return exampleBuilder.tags(tags).children(steps).build();
    });
    const tags = new Set([...tagsNew, ...buildTags(example.tags)]);
    return new ExamplesBuilder()
      .name(example.name)
      .description(example.description)
      .keyword(example.keyword.trim())
      .tags(tags)
      .titles(titles)
      .values(values)
      .children(scenarios)
      .build();
  });
}

export function scenarioExampleTitle(
  titleSegments: string[],
  scenarioName: string,
  row: string[]
) {
  const hasVariables = titleSegments.map((title) =>
    scenarioName.includes(`<${title}>`)
  );
  let name: string = scenarioName;
  if (hasVariables.length > 0 && hasVariables.includes(true)) {
    name = interpolateExamples(scenarioName, titleSegments, row);
  } else {
    const suffixVars = titleSegments
      .map((title, idx) => `${title}: ${row[idx]}`)
      .join(", ");
    const suffix = `<${suffixVars}>`;
    name = `${name} ${suffix}`;
  }
  return name;
}

export function interpolateExamples(
  name: string,
  titles: string[],
  values: string[]
) {
  if (titles.length !== values.length) {
    const message = `Titles must have the same length as values in an example Table but there was ${titles.length} titles and ${values.length} values.`;
    throw new AutomationError(message);
  }
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    const value = values[i];
    while (name.includes(`<${title}>`)) {
      name = name.replace(`<${title}>`, value);
    }
  }
  return name;
}

export function buildTags(tags: readonly Tag[]) {
  return tags.map((it) => it.name);
}
