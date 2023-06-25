import type { FeatureAction } from "./types";
import { ScenarioScope } from "./scenario-scope";
import { StepScope } from "./step-scope";
import { Scope } from "./scope";
import { ModifierType } from "@autometa/types";
import { HookCache } from "./caches/hook-cache";

export class RuleScope extends Scope {
  canHandleAsync = false;
  constructor(
    readonly title: string,
    readonly action: FeatureAction,
    parentHooks: HookCache,
    public readonly modifiers?: ModifierType
  ) {
    super(new HookCache(parentHooks));
  }

  get idString() {
    return this.title;
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
