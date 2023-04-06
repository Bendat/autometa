import {
  DocString as ds,
  Background as GherkinBackground,
  Feature as GherkinFeature,
  Rule as GherkinRule,
  Scenario as GherkinScenario,
  Tag,
  StepKeywordType,
} from "@cucumber/messages";
import { FeatureBuilder } from "../groups/feature";
import { Rule, RuleBuilder } from "../groups/rule";
import { ScenarioBuilder } from "../scenario";
import { ScenarioOutlineBuilder } from "../groups/scenario-outline";
import { ExamplesBuilder } from "../groups/examples";
import { DocString, StepBuilder, StepKeyword } from "../steps";
import { compileDatatable } from "../steps/datatables/table-type";
import { Background, BackgroundBuilder } from "../background";
import {
  isBackground,
  isRule,
  isScenarioOutline,
  isScenario,
  notEmpty,
} from "./validators";
import { FeatureChildType, RuleChildType } from "./FeatureChildType";

export function convertToClass(feature: GherkinFeature, filePath: string) {
  return new FeatureBuilder()
    .name(feature.name)
    .description(feature.description)
    .keyword(feature.keyword)
    .tags(buildTags(feature.tags))
    .uri(filePath)
    .language(feature.language)
    .children(buildChildren(feature));
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
  return featureOrRule.children
    .map((child) => {
      if (isBackground(child)) {
        if (!backgrounds) {
          backgrounds = [];
        }
        const bg = buildBackground(child, tags, featureOrRule);
        backgrounds.push(bg);
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
    })
    .filter(notEmpty);
}

export function buildScenario(
  scenario: GherkinScenario,
  backgrounds: Background[] | undefined,
  tagsNew: string[]
) {
  const steps = scenario.steps.map((step) =>
    new StepBuilder()
      .text(step.text)
      .docstring(new DocString(step.docString as unknown as ds))
      .table(compileDatatable(step.dataTable))
      .keyword(step.keyword as StepKeyword)
      .keywordType(step.keywordType as StepKeywordType)
      .build()
  );
  const [bg1, bg2] = backgrounds ?? [];
  const scen = new ScenarioBuilder()
    .name(scenario.name)
    .description(scenario.description)
    .tags(tagsNew)
    .steps(steps)
    .backgrounds([bg1, bg2])
    .keyword(scenario.keyword)
    .build();
  return scen;
}
export function buildOutline(scenario: GherkinScenario, tagsNew: string[]) {
  const examples = buildExamples(scenario, tagsNew);
  const outline = new ScenarioOutlineBuilder()
    .name(scenario.name)
    .tags(tagsNew)
    .keyword(scenario.keyword)
    .examples(examples)
    .build();
  return outline;
}

export function buildBackground(
  child: { background: GherkinBackground },
  tags: string[] | undefined,
  featureOrRule: GherkinFeature | GherkinRule
) {
  const { background } = child;

  const tagsNew = [...(tags ?? []), ...buildTags(featureOrRule.tags)];
  const bg = new BackgroundBuilder()
    .name(background.name)
    .description(background.description)
    .keyword(background.keyword)
    .tags(tagsNew)
    .build();
  return bg;
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
    .tags(tagsNew)
    .childer(buildChildren(rule, tagsNew, backgrounds))
    .build();
  return ruleObject;
}

export function buildExamples(scenario: GherkinScenario, tagsNew: string[]) {
  return scenario.examples.map((it) => {
    const titles = it.tableHeader?.cells.map((cell) => cell.value) ?? [];
    const values =
      it.tableBody.map((row) => row.cells.map((cell) => cell.value)) ?? [];

    const scenarios = values.map((row) => {
      const name = interpolateExamples(it.name, titles, row);
      return new ScenarioBuilder()
        .name(name)
        .description(scenario.description)
        .tags(tagsNew)
        .keyword(scenario.keyword)
        .build();
    });
    return new ExamplesBuilder()
      .name(it.name)
      .description(it.description)
      .keyword(it.keyword)
      .tags(tagsNew)
      .titles(titles)
      .values(values)
      .children(scenarios)
      .build();
  });
}

export function interpolateExamples(name: string, titles: string[], values: string[]) {
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
