import type { ScenarioAction } from "./types";
import { Scope } from "./scope";
import { StepScope } from "./step-scope";
import { ScenarioScope } from "./scenario-scope";
import type { Modifiers } from "../gherkin/types";
import { HookCache } from "../gherkin/step-cache";

export class ScenarioOutlineScope extends ScenarioScope {
  synchronous = true;
  constructor(
    public readonly title: string,
    public readonly action: ScenarioAction,
    parentHooks: HookCache,
    public readonly modifiers?: Modifiers
  ) {
    super(title, action, parentHooks, modifiers);
  }
  protected override get canAttachHook(): boolean {
    return true;
  }
  idString = () => this.title;

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
