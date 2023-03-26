import { ScenarioAction } from "./types";
import { Scope } from "./scope";
import { StepScope } from "./step-scope";
import { Modifiers } from "@gherkin/types";
import { HookCache } from "@gherkin/step-cache";

export class ScenarioScope extends Scope {
  synchronous = false;
  constructor(
    public readonly title: string,
    public readonly action: ScenarioAction,
    parentHooks: HookCache,
    public readonly modifiers?: Modifiers
  ) {
    super(new HookCache(parentHooks));
  }
  protected get canAttachHook(): boolean {
    return false;
  }

  idString = () => this.title;

  canAttach<T extends Scope>(childScope: T): boolean {
    return childScope instanceof StepScope;
  }
  attach<T extends Scope>(childScope: T): void {
    if (!this.canAttach(childScope)) {
      throw new Error(`A Scenario can only execute a a 'Step', such as 'Given', 'When' or 'Then`);
    }
    super.attach(childScope);
  }
}
