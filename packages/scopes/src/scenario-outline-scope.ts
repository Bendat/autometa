import { ScenarioAction } from "./types";
import { Scope } from "./scope";
import { StepScope } from "./step-scope";
import { ScenarioScope } from "./scenario-scope";
import { HookCache } from "./caches/hook-cache";
import { ModifierType } from "@autometa/types";

export class ScenarioOutlineScope extends ScenarioScope {
  canHandleAsync = true;
  constructor(
    public readonly title: string,
    public readonly action: ScenarioAction,
    parentHooks: HookCache,
    public readonly modifiers?: ModifierType
  ) {
    super(title, action, parentHooks, modifiers);
  }
  protected override get canAttachHook(): boolean {
    return true;
  }
  get idString() {
    return  this.title;
   }
 
  canAttach<T extends Scope>(childScope: T): boolean {
    return childScope instanceof StepScope;
  }
  attach<T extends Scope>(childScope: T): void {
    if (!this.canAttach(childScope)) {
      throw new Error(
        `A Scenario Outline can only execute a a 'Step', such as 'Given', 'When' or 'Then`
      );
    }
    super.attach(childScope);
  }
}