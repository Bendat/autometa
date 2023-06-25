import {
  Background as GherkinBackground,
  Feature as GherkinFeature,
  Rule as GherkinRule,
  Scenario as GherkinScenario,
  Tag,
  StepKeywordType,
  FeatureChild,
  RuleChild,
} from "@cucumber/messages";
import { FeatureBuilder } from "../groups/feature";
import { Rule, RuleBuilder } from "../groups/rule";
import { ScenarioBuilder } from "../scenario";
import { ScenarioOutlineBuilder } from "../groups/scenario-outline";
import { ExamplesBuilder } from "../groups/examples";
import { GherkinDocString, StepBuilder, StepKeyword } from "../steps";
import { compileDatatable } from "../steps/datatables/table-type";
import { Background, BackgroundBuilder } from "../background";
import {
  isBackground,
  isRule,
  isScenarioOutline,
  isScenario,
  notEmpty,
} from "./validators";
import { FeatureChildType, RuleChildType } from "./child-types";
import { ExampleBuilder } from "../example";

export function convertToClass(feature: GherkinFeature, filePath: string) {
  return new FeatureBuilder()
    .name(feature.name)
    .description(feature.description)
    .keyword(feature.keyword)
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
  const steps = makeSteps(scenario);
  const [bg1, bg2] = backgrounds ?? [];
  const scen = new ScenarioBuilder()
    .name(scenario.name)
    .description(scenario.description)
    .tags(new Set(tagsNew))
    .steps(steps)
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
    .keyword(scenario.keyword)
    .examples(examples)
    .build();
  return outline;
}

export function buildBackground(child: { background: GherkinBackground }) {
  const { background } = child;
  const steps = makeSteps(background);
  const bg = new BackgroundBuilder()
    .name(background.name)
    .description(background.description)
    .keyword(background.keyword)
    .steps(steps)
    .build();
  return bg;
}

function makeSteps(background: GherkinBackground | GherkinScenario) {
  return background.steps.map((step) => {
    const doc = step.docString ? new GherkinDocString(step.docString) : undefined;
    return new StepBuilder()
      .text(step.text)
      .docstring(doc)
      .table(compileDatatable(step.dataTable))
      .keyword(step.keyword as StepKeyword)
      .keywordType(step.keywordType as StepKeywordType)
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
    .keyword(rule?.keyword)
    .description(rule.description)
    .tags(new Set(tagsNew))
    .childer(buildChildren(rule, tagsNew, backgrounds))
    .build();
  return ruleObject;
}

export function buildExamples(scenario: GherkinScenario, tagsNew: string[]) {
  return scenario.examples.map((example) => {
    const titles = example.tableHeader?.cells.map((cell) => cell.value) ?? [];
    const values =
      example.tableBody.map((row) => row.cells.map((cell) => cell.value)) ?? [];

    const scenarios = values.map((row) => {
      const name = scenarioExampleTitle(titles, scenario, row);
      const exampleValues = titles
        .map((title, index) => {
          return { [title]: row[index] };
        })
        .reduce((old, current) => {
          return { ...old, ...current };
        }, {});
      const steps = makeSteps(scenario);
      return new ExampleBuilder()
        .name(name)
        .description(scenario.description)
        .tags(new Set([...tagsNew, ...buildTags(example.tags)]))
        .keyword("Example")
        .example(exampleValues)
        .steps(steps)
        .build();
    });
    return new ExamplesBuilder()
      .name(example.name)
      .description(example.description)
      .keyword(example.keyword)
      .tags(new Set([...tagsNew, ...buildTags(example.tags)]))
      .titles(titles)
      .values(values)
      .children(scenarios)
      .build();
  });
}

function scenarioExampleTitle(
  titles: string[],
  scenario: GherkinScenario,
  row: string[]
) {
  const hasVariables = titles.map((title) =>
    scenario.name.includes(`<${title}>`)
  );
  let name: string = scenario.name;
  if (hasVariables.length > 0 && !hasVariables.includes(false)) {
    name = interpolateExamples(scenario.name, titles, row);
  } else {
    const suffixVars = titles
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
    throw new Error(
      "Titles must have the same length as values in an example Table"
    );
  }
  for (let i = 0; i > titles.length; ) {
    const title = titles[i];
    const value = values[i];
    name = name.replace(`<${title}>`, value);
  }
  return name;
}

export function buildTags(tags: readonly Tag[]) {
  return tags.map((it) => it.name);
}
