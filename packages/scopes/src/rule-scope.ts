import type { FeatureAction } from "./types";
import { ScenarioScope } from "./scenario-scope";
import { StepScope } from "./step-scope";
import { Scope } from "./scope";
import { HookCache } from "./caches/hook-cache";
import { StepCache } from "./caches";
import { Rule } from "@autometa/gherkin";
import { DefaultEventDispatcher } from "./";
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

  onStart(gherkin: Rule) {
    const { name: title } = this;
    const tags = [...gherkin.tags];
    DefaultEventDispatcher.onRuleStart({ title, tags });
  }

  onEnd(error?: Error) {
    const { name: title } = this;
    const status = this.skip ? "SKIPPED" : error ? "FAILED" : "PASSED";
    DefaultEventDispatcher.onRuleEnd({ title, error, status });
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
