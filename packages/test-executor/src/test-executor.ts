import { ParameterTypeRegistry } from "@cucumber/cucumber-expressions";
import { FeatureScope, GlobalScope, scope } from "@autometa/scopes";
import { Feature } from "@autometa/gherkin";
import { TestExecutorConfig } from "./config.schema";
import { GherkinWalker } from "./gherkin-walker";
import {
  RuleBridge,
  JestCucumberBridge,
  FeatureBridge,
  ScenarioBridge,
  StepBridge,
} from "./bridges/bridge";
import { JestBridgeRunner } from "./bridges";

export class TestExecutor {
  #config: TestExecutorConfig;
  constructor(
    readonly global: GlobalScope,
    readonly parameterRegistry: ParameterTypeRegistry,
    readonly feature: Feature
  ) {}
  
  withConfig(config: TestExecutorConfig) {
    this.#config = config;
    this.#configActions();
    return this;
  }

  get appType() {
    return this.#config.cucumber.app;
  }

  // onFeatureExecuted(featureScope: FeatureScope) {
  //   const globalApp = getApp(this.appType);
  //   const factory = () => getApp(this.appType);
  //   const container = GherkinWalker.walk<TestGroupContainer>(
  //     {
  //       onFeature: (feature, accumulator) => {
  //         return accumulator
  //           .withData({ gherkin: feature, scope: featureScope })
  //           .withTopLevelApp(globalApp);
  //       },

  //       onRule: (rule, accumulator) => {
  //         const ruleScope = scope(featureScope).findRule(rule.name);
  //         const ruleAcc = accumulator
  //           .addRule(rule.name, { gherkin: rule, scope: ruleScope })
  //           .withTopLevelApp(globalApp);
  //         return ruleAcc;
  //       },

  //       onScenario: (scenario, accumulator, lastNode) => {
  //         const node = lastNode instanceof RuleScope ? scope(lastNode) : scope(featureScope);
  //         const scenarioScope = node?.findScenario(scenario.name);
  //         const data = { gherkin: scenario, scope: scenarioScope };
  //         accumulator.addScenario(scenario.name, data);
  //         return accumulator;
  //       },

  //       onStep: (step, accumulator) => {
  //         const stepScope = scope(featureScope).findStep(step.keywordType, step.text);
  //         const data = { gherkin: step, scope: stepScope };
  //         accumulator.addStep(step.text, data);
  //         return accumulator;
  //       },

  //       onScenarioOutline: (outline, accumulator) => {
  //         const outlineScope = scope(featureScope).findScenarioOutline(outline.name);
  //         const data = { gherkin: outline, scope: outlineScope };
  //         return accumulator.addOutline(outline.name, data);
  //       },

  //       onExamples: (examples, accumulator) => {
  //         const data = { gherkin: examples };
  //         return accumulator.addExamples(examples.name, data);
  //       },
  //     },
  //     this.feature,
  //     new TestGroupContainer(this.feature.name)
  //   );
  //   const { describe, test, name: _name, ...hooks } = this.#config.runner;
  //   container.withHooks(hooks);
  //   container.withTestFunctions(describe, test, factory);
  //   container.run();
  //   return container;
  // }

  onFeatureExecuted(featureScope: FeatureScope) {
    const bridge = new FeatureBridge();
    GherkinWalker.walk<JestCucumberBridge>(
      {
        onFeature: (feature, accumulator) => {
          accumulator.data = { gherkin: feature, scope: featureScope };
          return accumulator;
        },
        onRule: (rule, accumulator) => {
          const ruleScope = scope(featureScope).findRule(rule.name);
          const bridge = new RuleBridge();
          bridge.data = { gherkin: rule, scope: ruleScope };
          (accumulator as FeatureBridge).rules.push(bridge);
          return bridge;
        },
        onScenario: (gherkin, accumulator) => {
          const rule =
            accumulator instanceof RuleBridge ? accumulator.data.gherkin.name : undefined;
          const scenarioScope = scope(accumulator.data.scope).findScenario(gherkin.name, rule);
          const bridge = new ScenarioBridge();
          bridge.data = { gherkin, scope: scenarioScope };
          (accumulator as FeatureBridge | RuleBridge).scenarios.push(bridge);
          return bridge;
        },
        onStep: (step, accumulator) => {
          const stepScope = scope(accumulator.data.scope).findStep(step.keywordType, step.text);
          const bridge = new StepBridge();
          bridge.data = { gherkin: step, scope: stepScope };
          const acc = accumulator as ScenarioBridge | RuleBridge | FeatureBridge;
          acc.steps.push(bridge);
          return accumulator;
        },
      },
      this.feature,
      bridge
    );
    const runner = new JestBridgeRunner(this.#config);
    runner.runFeature(bridge);
  }

  #configActions() {
    const timeout = this.#config?.test?.timeout;
    const setter = this.#config.runner.timeoutFn;
    if (timeout !== undefined && setter !== undefined) {
      setter(timeout);
    }
    if (timeout !== undefined && setter === undefined) {
      console.warn(`Timeout was set to ${timeout} but no timeoutFn was provided. Timeout will not be set.

To set a timeout, provide a timeoutFn in the config. For example:

defineConfig({
  // ... other config
  runner: {
    // ... hooks, describe etc
    timeoutFn: jest.setTimeout
    
    // or
    timeoutFn: vi.setTimeout
  }
})  
`);
    }
  }
}
