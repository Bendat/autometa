import { ScenarioAction, StepText } from "./types";
import { Scope } from "./scope";
import { KeywordType } from "src/gherkin/step-cache";
import { TableType } from "@gherkin/datatables/table-type";

export class StepScope extends Scope {
  synchronous = false;
  constructor(
    readonly keyword: string,
    readonly keywordType: KeywordType,
    public readonly text: StepText,
    public readonly action: ScenarioAction,
    readonly tableType?: TableType<unknown>
  ) {
    super();
  }

  run = () => {
    // do nothing
  };

  idString = () => `${this.keyword}: ${this.text}`;

  canAttach<T extends Scope>(_: T): boolean {
    return false;
  }
  
  attach<T extends Scope>(_childScope: T): void {
    throw new Error(
      `Cannot execute a Cucumber function inside a ${this.keyword} Step. Not that you should see this error anyway. What did you do??`
    );
  }
}
