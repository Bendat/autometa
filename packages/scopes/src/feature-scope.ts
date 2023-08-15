import type { FeatureAction } from "./types";
import { ScenarioScope } from "./scenario-scope";
import { StepScope } from "./step-scope";
import { Scope } from "./scope";
import { RuleScope } from "./rule-scope";
import { HookCache } from "./caches/hook-cache";
import { StepCache } from "./caches";
import {  Feature } from "@autometa/gherkin";
import { BackgroundScope } from "./background-scope";
import { AutomationError } from "@autometa/errors";

export class FeatureScope extends Scope {
  canHandleAsync = true;
  constructor(
    readonly path: string,
    readonly action: FeatureAction | undefined,
    parentHookCache: HookCache,
    parentStepCache: StepCache,
    buildStepCache: () => unknown
  ) {
    super(parentHookCache, parentStepCache, buildStepCache);
    this.path = path;
  }

  get idString() {
    return this.path;
  }

  title(gherkin: Feature) {
    return `${gherkin.keyword}: ${gherkin.name}`;
  }

  canAttach<T extends Scope>(childScope: T): boolean {
    return (
      childScope instanceof ScenarioScope ||
      childScope instanceof StepScope ||
      childScope instanceof RuleScope ||
      childScope instanceof BackgroundScope
    );
  }

  attach<T extends Scope>(childScope: T): void {
    if (!this.canAttach(childScope)) {
      throw new AutomationError(
        `A Feature can only execute a 'Scenario', 'Scenario Outline', 'Rule' or 'Step'(Given, When etc). ${childScope.constructor.name} is not valid`
      );
    }
    super.attach(childScope);
  }
}
