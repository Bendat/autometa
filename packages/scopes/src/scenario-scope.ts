import type { ScenarioAction } from "./types";
import { Scope } from "./scope";
import { StepScope } from "./step-scope";
import { HookCache } from "./caches/hook-cache";

export class ScenarioScope extends Scope {
  canHandleAsync = false;
  constructor(
    public readonly title: string,
    public readonly action: ScenarioAction,
    parentHooks: HookCache,
  ) {
    super(new HookCache(parentHooks));
  }
  protected get canAttachHook(): boolean {
    return false;
  }

  get idString() {
    return this.title;
  }

  canAttach<T extends Scope>(childScope: T): boolean {
    return childScope instanceof StepScope;
  }

  attach<T extends Scope>(childScope: T): void {
    if (!this.canAttach(childScope)) {
      throw new Error(
        `A Scenario can only execute a a 'Step', such as 'Given', 'When' or 'Then`
      );
    }
    super.attach(childScope);
  }
}
