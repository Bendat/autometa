import type { ScenarioAction } from "./types";
import { Scope } from "./scope";
import { StepScope } from "./step-scope";
import { ScenarioScope } from "./scenario-scope";
import { HookCache } from "./caches/hook-cache";
import { StepCache } from "./caches";
import { AutomationError } from "@autometa/errors";

export class ScenarioOutlineScope extends ScenarioScope {
  canHandleAsync = false;
  constructor(
    public readonly name: string,
    public readonly action: ScenarioAction,
    parentHookCache: HookCache,
    parentStepCache: StepCache,
  ) {
    super(name, action, parentHookCache, parentStepCache);
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
