import type { FeatureAction } from "./types";
import { ScenarioScope } from "./scenario-scope";
import { StepScope } from "./step-scope";
import { Scope } from "./scope";
import type { Modifiers } from "../gherkin/types";
import { HookCache } from "../gherkin/step-cache";
import { RuleScope } from "./rule-scope";

export class FeatureScope extends Scope {
  synchronous = true;
  #path: string;
  constructor(
    readonly action: FeatureAction,
    readonly path: string,
    parentHooks: HookCache,
    public readonly modifiers?: Modifiers
  ) {
    super(new HookCache(parentHooks));
    this.#path = path;
  }

  idString = () => this.#path;

  canAttach<T extends Scope>(childScope: T): boolean {
    return (
      childScope instanceof ScenarioScope ||
      childScope instanceof StepScope ||
      childScope instanceof RuleScope
    );
  }
  attach<T extends Scope>(childScope: T): void {
    if (!this.canAttach(childScope)) {
      throw new Error(
        `A Feature can only execute a 'Scenario', 'Scenario Outline', 'Rule' or 'Step'(Given, When etc). ${childScope.constructor.name} is not valid`
      );
    }
    super.attach(childScope);
  }
}
