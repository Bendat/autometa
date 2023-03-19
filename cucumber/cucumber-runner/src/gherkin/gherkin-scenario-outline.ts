import { ScenarioOutlineScope } from "../test-scopes/scenario-outline-scope";
import { StepScope } from "../test-scopes/step-scope";
import { GherkinNode } from "./gherkin-node";
import { Scenario } from "./parser.types";
import { HookCache, StepCache } from "./step-cache";
import { GherkinScenario } from "./gherkin-scenario";
import { GherkinExamples } from "./gherkin-examples";
import { GherkinStep } from "./gherkin-steps";
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
  get title() {
    return this.message.name;
  }
  get modifier(): Modifiers | undefined {
    return this.#modifier;
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
}
