import type { ScenarioAction } from "./types";
import { Scope } from "./scope";
import { StepScope } from "./step-scope";
import { HookCache } from "./caches/hook-cache";
import { StepCache } from "./caches";
import { Scenario, ScenarioOutline } from "@autometa/gherkin";

export class ScenarioScope extends Scope {
  canHandleAsync = false;
  constructor(
    public readonly name: string,
    public readonly action: ScenarioAction,
    parentHooksCache: HookCache,
    parentStepCache: StepCache
  ) {
    super(parentHooksCache, parentStepCache);
  }
  protected get canAttachHook(): boolean {
    return false;
  }

  get idString() {
    return this.name;
  }
  title(gherkin: Scenario | ScenarioOutline) {
    return `${gherkin.keyword}: ${this.name}`
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
