import {
  FeatureScope,
  RuleScope,
  ScenarioOutlineScope,
  StepCache
} from "@autometa/scopes";
import {
  BackgroundBridge,
  ExampleBridge,
  ExamplesBridge,
  FeatureBridge,
  GherkinCodeBridge,
  RuleBridge,
  ScenarioBridge,
  ScenarioOutlineBridge,
  StepBridge
} from "./bridges";
import { GherkinWalker } from "./gherkin-walker";
import { scope } from "./scope-search";
import { Bind } from "@autometa/bind-decorator";
import {
  Example,
  Feature,
  GherkinNode,
  scenarioExampleTitle
} from "@autometa/gherkin";
import { raise } from "@autometa/errors";
import { StepKeyword, StepType } from "@autometa/types";
export class TestBuilder {
  constructor(readonly feature: Feature) {}
  @Bind
  onFeatureExecuted(featureScope: FeatureScope) {
    const bridge = new FeatureBridge();
    GherkinWalker.walk<GherkinCodeBridge>(
      {
        onFeature: (feature, accumulator) => {
          featureScope.buildStepCache();
          accumulator.data = { gherkin: feature, scope: featureScope };
          return accumulator;
        },
        onRule: (rule, accumulator) => {
          const ruleScope = scope(featureScope).findRule(
            rule.name
          ) as RuleScope;
          const bridge = new RuleBridge();
          bridge.data = { gherkin: rule, scope: ruleScope };
          (accumulator as FeatureBridge).rules.push(bridge);
          return bridge;
        },
        onScenario: (gherkin, accumulator) => {
          const scenarioScope = scope(accumulator.data.scope).findScenario(
            gherkin.name
          );
          const bridge = new ScenarioBridge();
          bridge.data = { gherkin, scope: scenarioScope };
          (accumulator as FeatureBridge | RuleBridge).scenarios.push(bridge);
          // if accumulator is a outline, push to examples

          return bridge;
        },
        onScenarioOutline: (gherkin, accumulator) => {
          const outlineScope = scope(
            accumulator.data.scope
          ).findScenarioOutline(gherkin.name);
          const bridge = new ScenarioOutlineBridge();
          bridge.data = { gherkin, scope: outlineScope };
          (accumulator as FeatureBridge | RuleBridge).scenarios.push(bridge);
          return bridge;
        },
        onExamples: (gherkin, accumulator) => {
          const outlineScope = accumulator.data.scope as ScenarioOutlineScope;
          const bridge = new ExamplesBridge();
          bridge.data = { gherkin, scope: outlineScope };
          (accumulator as ScenarioOutlineBridge).examples.push(bridge);
          return bridge;
        },
        onExample(gherkin, accumulator) {
          if(gherkin.table === undefined){
            raise(`Example ${gherkin.name} has no Example Table data. A Row of data is required.`);
          }
          const titleSegments = Object.keys(gherkin.table);
          const values = Object.values(gherkin.table);
          const title = scenarioExampleTitle(
            titleSegments,
            gherkin.name,
            values
          );

          const exampleScope = scope(accumulator.data.scope).findExample(title);
          const bridge = new ExampleBridge();
          bridge.data = { gherkin, scope: exampleScope };
          const acc = accumulator as ExamplesBridge;
          acc.scenarios.push(bridge);
          return bridge;
        },
        onBackground(gherkin, accumulator) {
          const backgroundScope = scope(accumulator.data.scope).findBackground({
            name: gherkin.name
          });
          const bridge = new BackgroundBridge();
          bridge.data = { gherkin, scope: backgroundScope };
          const acc = accumulator as FeatureBridge | RuleBridge;
          acc.background = bridge;
          return bridge;
        },
        onStep: (step, accumulator) => {
          const {
            data: { scope: parentScope, gherkin }
          } = accumulator;
          const { keyword, keywordType, text } = step;
          const cache = parentScope.stepCache;
          const existing = getStep(
            accumulator,
            gherkin,
            cache,
            keywordType,
            keyword,
            text
          );
          const bridge = new StepBridge();
          const acc = accumulator as
            | BackgroundBridge
            | ScenarioBridge
            | RuleBridge
            | FeatureBridge;

          if (existing) {
            bridge.data = {
              gherkin: step,
              scope: existing.step,
              args: existing.args
            };
          } else {
            raise(`No step definition matching ${step.keyword} ${step.text}`);
          }

          acc.steps.push(bridge);
          return accumulator;
        }
      },
      this.feature,
      bridge
    );
    return bridge;
  }
}
function getStep(
  accumulator: GherkinCodeBridge,
  gherkin: GherkinNode,
  cache: StepCache,
  keywordType: StepType,
  keyword: StepKeyword,
  text: string
) {
  if (accumulator instanceof ExampleBridge) {
    const scenario = gherkin as Example;
    if (scenario.table) {
      return cache.findByExample(keywordType, keyword, text, scenario.table);
    }
  }
  return cache.find(keywordType, keyword, text);
}
