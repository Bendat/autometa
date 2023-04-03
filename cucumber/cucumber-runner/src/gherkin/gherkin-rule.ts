import { Background, Rule } from "@cucumber/messages";
import { RuleScope } from "../test-scopes/rule-scope";
import { ScenarioScope } from "../test-scopes/scenario-scope";
import { StepScope } from "../test-scopes/step-scope";
import { HookCache, StepCache } from "./step-cache";
import { GherkinScenarioOutline } from "./gherkin-scenario-outline";
import { GherkinScenario } from "./gherkin-scenario";
import { GherkinNode } from "./gherkin-node";
import { Modifiers } from "./types";
import { ScenarioOutlineScope } from "@scopes/scenario-outline-scope";
export type RuleMessage = { rule: Rule; backgrounds?: { background: Background }[] };

export class GherkinRule extends GherkinNode {
  tags: string[] = [];
  childer: Array<GherkinScenario | GherkinScenarioOutline> = [];
  hooks: HookCache;
  #modifier?: Modifiers;
  constructor(
    readonly message: RuleMessage,
    readonly stepCache: StepCache,
    inheritedTags?: string[]
  ) {
    super();
    this.takeTags([...message.rule.tags], ...(inheritedTags ?? []));

    this.#buildChildren(message);
  }
  get modifier(): Modifiers | undefined {
    return this.#modifier;
  }

  get title() {
    return this.message.rule.name ?? "";
  }

  build(rule: RuleScope) {
    this.#buildFromScope(rule);
  }

  #buildFromScope(rule: RuleScope) {
    this.hooks = rule.hooks;
    rule.closedScopes.forEach((scope) => {
      if (scope instanceof StepScope) {
        this.#buildStep(scope);
      } else if (scope instanceof ScenarioOutlineScope) {
        this.#buildScenarioOutline(scope);
      } else if (scope instanceof ScenarioScope) {
        this.#buildScenario(scope);
      }
    });
  }

  #buildScenario(scope: ScenarioScope) {
    const matching = this.childer.find(
      (it) => it.message.scenario.name === scope.title
    ) as GherkinScenario;
    if (matching) {
      matching.build(scope);
    } else {
      throw new Error(`Unknown Scenario ${scope.title} for Feature: ${this.message.rule.name}`);
    }
  }
  #buildScenarioOutline(scope: ScenarioOutlineScope) {
    const matching = this.childer.find((it) => it.message.scenario.name === scope.title);
    if (matching) {
      matching.build(scope);
    } else {
      throw new Error(`Unknown Scenario ${scope.title} for Feature: ${this.message.rule.name}`);
    }
  }
  #buildStep(scope: StepScope) {
    const { keywordType, keyword, text, action } = scope;
    this.stepCache.add(keywordType, keyword, text, action);
  }

  #buildChildren(message: RuleMessage) {
    const ruleBackground = message.rule.children.find((it) => it.background) as {
      background: Background;
    };
    const backgrounds = [ruleBackground].filter((it) => it);
    for (const { scenario } of message.rule.children) {
      if (scenario) {
        // scenario
        if (scenario.examples.length === 0) {
          this.childer.push(
            new GherkinScenario({ scenario, backgrounds }, new StepCache(this.stepCache), this.tags)
          );
          // scenario outline
        } else {
          this.childer.push(
            new GherkinScenarioOutline(
              { scenario, backgrounds },
              new StepCache(this.stepCache),
              this.tags
            )
          );
        }
      }
    }
  }
}
