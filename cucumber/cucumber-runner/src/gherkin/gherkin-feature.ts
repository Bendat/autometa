import { FeatureScope, RuleScope } from "../test-scopes/feature-scope";
import { ScenarioScope } from "../test-scopes/scenario-scope";
import { StepScope } from "../test-scopes/step-scope";
import { GherkinRule } from "./gherkin-rule";
import { GherkinNode } from "./gherkin-node";
import { Feature } from "./parser.types";
import { HookCache, StepCache } from "./step-cache";
import { GherkinScenario } from "./gherkin-scenario";
import { GherkinScenarioOutline } from "./gherkin-scenario-outline";
import { TestFunctions } from "./test-functions";
import { getApp } from "../di/get-app";
import { executeHooks } from "@scopes/hooks";
import { Scope } from "@scopes/scope";
import { Modifiers } from "./types";

export class GherkinFeature extends GherkinNode {
  tags: string[] = [];
  childer: Array<GherkinScenario | GherkinScenarioOutline | GherkinRule> = [];
  hooks: HookCache;
  #modifier?: Modifiers;
  constructor(readonly message: Feature, readonly stepCache: StepCache) {
    super();
    this.takeTags([...message.tags]);
    this.#buildChildren(message);
  }

  build(feature: FeatureScope) {
    this.#modifier = feature.modifiers;
    this.buildFromScope(feature);
  }
  private buildFromScope(feature: FeatureScope) {
    this.hooks = feature.hooks;
    feature.closedScopes.forEach((scope) => {
      this.#handleChildScope(scope);
    });
  }

  test(testFunctions: TestFunctions, _app: unknown, globalHooks: HookCache): void {
    const groupFn = this.tagFilter(testFunctions.describe, this.#modifier);
    groupFn(`Feature: ${this.message.name}`, () => {
      let app: unknown;
      testFunctions.beforeEach(async () => {
        app = getApp();
      });
      this.loadHooks(testFunctions, globalHooks, app);
      for (const child of this.childer) {
        child.test(testFunctions, () => app);
      }
    });
  }

  private loadHooks(testFunctions: TestFunctions, globalHooks: HookCache, app: unknown) {
    if (!this.hooks) {
      return;
    }
    testFunctions.beforeAll(async (...args) => {
      await executeHooks(globalHooks.setup, ...args);
      await executeHooks(this.hooks.setup, ...args);
    });
    testFunctions.beforeEach(async (...args) => {
      await executeHooks(globalHooks.before, app, ...args);
      await executeHooks(this.hooks.before, app, ...args);
    });

    testFunctions.afterEach(async (...args) => {
      await executeHooks(globalHooks.after, app, ...args);
      await executeHooks(this.hooks.after, app, ...args);
    });

    testFunctions.afterAll(async (...args) => {
      await executeHooks(globalHooks.teardown, ...args);
      await executeHooks(this.hooks.setup, ...args);
    });
  }

  #handleChildScope(scope: Scope) {
    if (scope instanceof StepScope) {
      this.#loadStepScope(scope);
    } else if (scope instanceof ScenarioScope) {
      this.#loadScenarioScope(scope);
    }
    if (scope instanceof RuleScope) {
      this.#loadRuleScope(scope);
    }
  }

  #loadRuleScope(scope: RuleScope) {
    const matching = this.childer.find((it) => it.message.name === scope.title) as GherkinRule;
    if (matching) {
      matching.build(scope);
    } else {
      throw new Error(`Unknown Scenario ${scope.title} for Feature: ${this.message.name}`);
    }
  }

  #loadScenarioScope(scope: ScenarioScope) {
    const matching = this.childer.find((it) => it.message.name === scope.title) as GherkinScenario;
    if (matching) {
      matching.build(scope);
    } else {
      throw new Error(`Unknown Scenario ${scope.title} for Feature: ${this.message.name}`);
    }
  }

  #loadStepScope(scope: StepScope) {
    const { keywordType, keyword, text, action } = scope;
    this.stepCache.add(keywordType, keyword, text, action);
  }

  #buildChildren(message: Feature) {
    for (const child of message.children) {
      if (child.scenario) {
        if (child.scenario.examples.length === 0) {
          this.childer.push(
            new GherkinScenario(child.scenario, new StepCache(this.stepCache), this.tags)
          );
        } else {
          this.childer.push(
            new GherkinScenarioOutline(child.scenario, new StepCache(this.stepCache), this.tags)
          );
        }
      }
      if (child.rule) {
        this.childer.push(new GherkinRule(child.rule, new StepCache(this.stepCache), this.tags));
      }
    }
  }
}
