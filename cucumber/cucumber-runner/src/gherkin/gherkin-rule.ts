import { Rule } from "@cucumber/messages";
import { RuleScope } from "../test-scopes/feature-scope";
import { ScenarioScope } from "../test-scopes/scenario-scope";
import { StepScope } from "../test-scopes/step-scope";
import { HookCache, StepCache } from "./step-cache";
import { TestFunctions } from "./test-functions";
import { GherkinScenarioOutline } from "./gherkin-scenario-outline";
import { GherkinScenario } from "./gherkin-scenario";
import { GherkinNode } from "./gherkin-node";
import { executeHooks } from "@scopes/hooks";
import { Modifiers } from "./types";

export class GherkinRule extends GherkinNode {
  tags: string[] = [];
  childer: Array<GherkinScenario | GherkinScenarioOutline> = [];
  hooks: HookCache;
  #modifier?: Modifiers;
  constructor(readonly message: Rule, readonly stepCache: StepCache, inheritedTags?: string[]) {
    super();
    this.takeTags([...message.tags], ...(inheritedTags ?? []));

    this.#buildChildren(message);
  }

  build(rule: RuleScope) {
    this.#buildFromScope(rule);
  }

  test(testFunctions: TestFunctions, app: () => unknown): void {
    const groupFn = this.tagFilter(testFunctions.describe, this.#modifier);
    groupFn(`Rule: ${this.message.name}`, () => {
      this.loadHooks(testFunctions, app);
      for (const child of this.childer) {
        child.test(testFunctions, app);
      }
    });
  }

  private loadHooks(testFunctions: TestFunctions, app: () => unknown) {
    if (!this.hooks) {
      return;
    }
    testFunctions.beforeAll(async (...args) => {
      await executeHooks(this.hooks.setup, ...args);
    });
    testFunctions.beforeEach(async (...args) => {
      await executeHooks(this.hooks.before, app(), ...args);
    });

    testFunctions.afterEach(async (...args) => {
      await executeHooks(this.hooks.after, app(), ...args);
    });
    testFunctions.afterAll(async (...args) => {
      await executeHooks(this.hooks.setup, ...args);
    });
  }

  #buildFromScope(rule: RuleScope) {
    this.hooks = rule.hooks;
    rule.closedScopes.forEach((scope) => {
      if (scope instanceof StepScope) {
        this.#buildStep(scope);
      } else if (scope instanceof ScenarioScope) {
        this.#buildScenario(scope);
      }
    });
  }

  #buildScenario(scope: ScenarioScope) {
    const matching = this.childer.find((it) => it.message.name === scope.title);
    if (matching) {
      matching.build(scope);
    } else {
      throw new Error(`Unknown Scenario ${scope.title} for Feature: ${this.message.name}`);
    }
  }

  #buildStep(scope: StepScope) {
    const { keywordType, keyword, text, action } = scope;
    this.stepCache.add(keywordType, keyword, text, action);
  }

  #buildChildren(message: Rule) {
    for (const child of message.children) {
      if (child.scenario) {
        // scenario
        if (child.scenario.examples.length === 0) {
          this.childer.push(
            new GherkinScenario(child.scenario, new StepCache(this.stepCache), this.tags)
          );
          // scenario outline
        } else {
          this.childer.push(
            new GherkinScenarioOutline(child.scenario, new StepCache(this.stepCache), this.tags)
          );
        }
      }
    }
  }
}
