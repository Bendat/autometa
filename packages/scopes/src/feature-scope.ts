import type { FeatureAction } from "./types";
import { ScenarioScope } from "./scenario-scope";
import { StepScope } from "./step-scope";
import { Scope } from "./scope";
import { RuleScope } from "./rule-scope";
import { HookCache } from "./caches/hook-cache";

export class FeatureScope extends Scope {
  canHandleAsync = true;
  #path: string;
  constructor(
    readonly path: string,
    readonly action: FeatureAction | undefined,
    parentHooks: HookCache
  ) {
    super(new HookCache(parentHooks));
    this.#path = path;
  }

  public get idString() {
    return this.#path;
  }

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
