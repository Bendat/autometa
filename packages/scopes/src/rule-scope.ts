import type { FeatureAction, TimedScope } from "./types";
import { ScenarioScope } from "./scenario-scope";
import { StepScope } from "./step-scope";
import { Scope } from "./scope";
import { HookCache } from "./caches/hook-cache";
import { StepCache } from "./caches";
import { ScenarioOutlineScope } from "./scenario-outline-scope";
import { BackgroundScope } from "./background-scope";
import { Rule } from "@autometa/gherkin";
import { AutomationError } from "@autometa/errors";
import { Timeout } from "./timeout";
export class RuleScope extends Scope implements TimedScope {
  canHandleAsync = false;
  constructor(
    readonly name: string,
    readonly action: FeatureAction,
    readonly timeout: Timeout | undefined,
    parentHookCache: HookCache,
    parentStepCache: StepCache
  ) {
    super(parentHookCache, parentStepCache);
  }

  get idString() {
    return this.name;
  }

  title(gherkin: Rule) {
    return `${gherkin.keyword}: ${this.name}`;
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
      throw new AutomationError(
        `A Rule can only execute a ${ScenarioScope.name}, ${ScenarioOutlineScope.name} or ${StepScope.name}. ${childScope.constructor.name} is not valid`
      );
    }
    super.attach(childScope);
  }
}
