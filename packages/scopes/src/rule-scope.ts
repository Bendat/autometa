import type { FeatureAction } from "./types";
import { ScenarioScope } from "./scenario-scope";
import { StepScope } from "./step-scope";
import { Scope } from "./scope";
import { HookCache } from "./caches/hook-cache";
import { StepCache } from "./caches";
import { ScenarioOutlineScope } from "./scenario-outline-scope";
import { BackgroundScope } from "./background-scope";
export class RuleScope extends Scope {
  canHandleAsync = false;
  constructor(
    readonly name: string,
    readonly action: FeatureAction,
    parentHookCache: HookCache,
    parentStepCache: StepCache,
    buildStepCache: () => unknown
  ) {
    super(new HookCache(parentHookCache), parentStepCache, buildStepCache);
  }

  get idString() {
    return this.name;
  }

  canAttach<T extends Scope>(childScope: T): boolean {
    return (
      childScope instanceof ScenarioScope ||
      childScope instanceof StepScope ||
      childScope instanceof BackgroundScope
    );
  }

  attach<T extends Scope>(childScope: T): void {
    if (!this.canAttach(childScope)) {
      throw new Error(
        `A Rule can only execute a ${ScenarioScope.name}, ${ScenarioOutlineScope.name} or ${StepScope.name}. ${childScope.constructor.name} is not valid`
      );
    }
    super.attach(childScope);
  }
}
