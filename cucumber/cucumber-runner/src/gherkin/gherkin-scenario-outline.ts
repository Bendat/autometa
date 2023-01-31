import { ScenarioOutlineScope } from "../test-scopes/scenario-outline-scope";
import { StepScope } from "../test-scopes/step-scope";
import { GherkinNode } from "./gherkin-node";
import { Scenario } from "./parser.types";
import { HookCache, StepCache } from "./step-cache";
import { GherkinScenario } from "./gherkin-scenario";
import { GherkinExamples } from "./gherkin-examples";
import { TestFunctions } from "./test-functions";
import { GherkinStep } from "./gherkin-steps";
import { executeHooks } from "@scopes/hooks";
import { Modifiers } from "./types";

export class GherkinScenarioOutline extends GherkinNode {
  hooks: HookCache;
  readonly tags: string[] = [];
  readonly steps: GherkinStep[] = [];
  readonly examples: GherkinExamples[] = [];
  readonly scenarios: GherkinScenario[] = [];
  #modifier: Modifiers | undefined;
  constructor(readonly message: Scenario, readonly stepCache: StepCache, inheritedTags: string[]) {
    super();
    this.takeTags([...message.tags], ...inheritedTags);

    if (message.examples) {
      for (const example of message.examples) {
        this.examples.push(new GherkinExamples(example, message, this.tags, this.stepCache));
      }
    }
    for (const example of this.examples) {
      for (const row of example.rows) {
        const scenarioExample = row.map((it, idx) => ({
          key: example.headers[idx],
          value: it,
        }));
        this.scenarios.push(new GherkinScenario(message, stepCache, this.tags, scenarioExample));
      }
    }
  }

  build = (scope: ScenarioOutlineScope) => {
    this.hooks = scope.hooks;
    this.#modifier = scope.modifiers;
    scope.closedScopes.forEach((scope) => {
      if (scope instanceof StepScope) {
        const { keywordType, keyword, text, action } = scope;
        this.stepCache.add(keywordType, keyword, text, action);
        return;
      }
    });
  };
  test(testFunctions: TestFunctions, app: () => unknown): void {
    const groupFn = this.tagFilter(testFunctions.describe, this.#modifier);
    groupFn(`Scenario Outline: ${this.message.name}`, () => {
      this.loadHooks(testFunctions, app);
      for (const example of this.examples) {
        example.test(testFunctions, app, this.examples.length !== 1);
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
}
