import { ScenarioAction } from "./types";
import { Scope } from "./scope";
import {
  ParsedDataTable,
  StepKeyword,
  StepType,
  TableType,
} from "@autometa/gherkin";
import { HookCache } from "./caches/hook-cache";
import { Expression } from "@cucumber/cucumber-expressions";
import { Bind } from "@autometa/bind-decorator";

export class StepScope extends Scope {
  canHandleAsync = false;
  constructor(
    readonly keyword: StepKeyword,
    readonly keywordType: StepType,
    public readonly expression: Expression,
    public readonly action: ScenarioAction,
    readonly tableType?: TableType<ParsedDataTable>
  ) {
    super(new HookCache());
  }
  #args?: unknown[];
  matches(text: string) {
    const match = this.expression.match(text);
    if (text === this.expression.source || match !== null) {
      this.#args = match?.map((it) => it.getValue(null));
      return true;
    }
    return false;
  }
  getArgs(text: string): unknown[] {
    if (this.#args) {
      return this.#args;
    }
    const match = this.expression.match(text);
    if (text === this.expression.source || match !== null) {
      return match?.map((it) => it.getValue(null)) ?? [];
    }
    return [];
  }
  @Bind
  run() {
    // do nothing
  }

  get idString() {
    return `${this.keyword}: ${this.expression}`;
  }

  canAttach<T extends Scope>(_: T): boolean {
    return false;
  }

  attach<T extends Scope>(_childScope: T): void {
    throw new Error(
      `Cannot execute a Cucumber function inside a ${this.keyword} Step. Not that you should see this error anyway. What did you do??`
    );
  }
}
