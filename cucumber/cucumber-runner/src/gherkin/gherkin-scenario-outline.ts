import { ScenarioOutlineScope } from "../test-scopes/scenario-outline-scope";
import { StepScope } from "../test-scopes/step-scope";
import { GherkinNode } from "./gherkin-node";
import { HookCache, StepCache } from "./step-cache";
import { GherkinScenario, ScenarioMessage } from "./gherkin-scenario";
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
  constructor(
    readonly message: ScenarioMessage,
    readonly stepCache: StepCache,
    inheritedTags: string[]
  ) {
    super();
    this.takeTags([...message.scenario.tags], ...inheritedTags);

    if (message.scenario.examples) {
      for (const examples of message.scenario.examples) {
        this.examples.push(
          new GherkinExamples(
            { examples, backgrounds: this.message.backgrounds ?? [] },
            message.scenario,
            this.tags,
            this.stepCache
          )
        );
      }
    }
    for (let exampleIdx = 0; exampleIdx < this.examples.length; exampleIdx++) {
      const example = this.examples[exampleIdx];
      for (let rowId = 0; rowId < example.rows.length; rowId++) {
        const row = example.rows[rowId];
        const scenarioExample = row.map((it, idx) => ({
          key: example.headers[idx],
          value: it,
        }));
        this.scenarios.push(
          new GherkinScenario(
            message,
            stepCache,
            this.tags,
            scenarioExample,
            Number(
              `${String(exampleIdx).padStart(4, String(exampleIdx))}${String(rowId).padStart(
                4,
                String(rowId)
              )}`
            )
          )
        );
      }
    }
  }
  get title() {
    return this.message.scenario.name;
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