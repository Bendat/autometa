import { ScenarioAction } from "./types";
import { Scope } from "./scope";
import { StepScope } from "./step-scope";
import { ScenarioScope } from "./scenario-scope";
import { Modifiers } from "@gherkin/types";

export class ScenarioOutlineScope extends ScenarioScope {
  synchronous = true;
  constructor(
    public readonly title: string,
    public readonly action: ScenarioAction,
    public readonly modifiers?: Modifiers
  ) {
    super(title, action);
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
