import type { FeatureAction } from "./types";
import { ScenarioScope } from "./scenario-scope";
import { StepScope } from "./step-scope";
import { Scope } from "./scope";
import { HookCache } from "./caches/hook-cache";
import { StepCache } from "./caches";
export class RuleScope extends Scope {
  canHandleAsync = false;
  constructor(
    readonly name: string,
    readonly action: FeatureAction,
    parentHookCache: HookCache,
    parentStepCache: StepCache
  ) {
    super(new HookCache(parentHookCache), parentStepCache);
  }

  get idString() {
    return this.name;
  }

  canAttach<T extends Scope>(childScope: T): boolean {
    return (
      childScope instanceof ScenarioScope || childScope instanceof StepScope
    );
  }

  attach<T extends Scope>(childScope: T): void {
    if (!this.canAttach(childScope)) {
      throw new Error(
        `A Feature can only execute a ${ScenarioScope.name} or ${StepScope.name}. ${childScope.constructor.name} is not valid`
      );
    }
    super.attach(childScope);
  }
}
