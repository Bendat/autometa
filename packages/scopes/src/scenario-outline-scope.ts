import type { ScenarioAction, TimedScope } from "./types";
import { Scope } from "./scope";
import { StepScope } from "./step-scope";
import { ScenarioScope } from "./scenario-scope";
import { HookCache } from "./caches/hook-cache";
import { StepCache } from "./caches";
import { AutomationError } from "@autometa/errors";
import { Timeout } from "./timeout";

export class ScenarioOutlineScope extends ScenarioScope implements TimedScope {
  canHandleAsync = false;
  constructor(
    public readonly name: string,
    public readonly action: ScenarioAction,
    timeout: Timeout | undefined,
    parentHookCache: HookCache,
    parentStepCache: StepCache
  ) {
    super(name, action, timeout, parentHookCache, parentStepCache);
  }
  protected override get canAttachHook(): boolean {
    return true;
  }
  get idString() {
    return this.name;
  }

  canAttach<T extends Scope>(childScope: T): boolean {
    return (
      childScope instanceof StepScope || childScope instanceof ScenarioScope
    );
  }
  attach<T extends Scope>(childScope: T): void {
    if (!this.canAttach(childScope)) {
      throw new AutomationError(
        `A Scenario Outline can only execute a a 'Step', such as 'Given', 'When' or 'Then', or a 'Scenario'. ${childScope} is not allowed.}`
      );
    }
    super.attach(childScope);
  }
}
