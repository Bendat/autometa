import type { FeatureAction } from "./types";
import { ScenarioScope } from "./scenario-scope";
import { StepScope } from "./step-scope";
import { Scope } from "./scope";
import type { Modifiers } from "@gherkin/types";
import { HookCache } from "@gherkin/step-cache";

export class RuleScope extends Scope {
  synchronous = true;
  constructor(
    readonly title: string,
    readonly action: FeatureAction,
    parentHooks: HookCache,
    public readonly modifiers?: Modifiers
  ) {
    super(new HookCache(parentHooks));
  }

  idString = () => this.title;

  canAttach<T extends Scope>(childScope: T): boolean {
    return childScope instanceof ScenarioScope || childScope instanceof StepScope;
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
