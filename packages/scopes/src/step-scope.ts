import type { StepAction } from "./types";
import { Scope } from "./scope";
import { Step, StepKeyword, StepType } from "@autometa/gherkin";
import { HookCache } from "./caches/hook-cache";
import { Expression } from "@cucumber/cucumber-expressions";
import { Bind } from "@autometa/bind-decorator";
import { StepCache } from "./caches";
import { App } from "@autometa/app";
import { Empty_Function } from "./novelties";
import { DataTable } from "@autometa/gherkin";
import { Class } from "@autometa/types";
import { captureError } from "./capture-error";
import { AutomationError } from "@autometa/errors";
export class StepScope<TText extends string, TTable> extends Scope {
  canHandleAsync = true;
  action = Empty_Function;
  constructor(
    readonly keyword: StepKeyword,
    readonly keywordType: StepType,
    public readonly expression: Expression,
    public readonly stepAction: StepAction<TText, TTable>,
    readonly tablePrototype?: Class<DataTable>
  ) {
    super(new HookCache(), new StepCache());
  }

  @Bind
  matches(text: string) {
    const match = this.expression.match(text);
    if (text === this.expression.source || match !== null) {
      return true;
    }
    return false;
  }

  @Bind
  getArgs(text: string): unknown[] {
    const match = this.expression.match(text);
    if (text === this.expression.source || match !== null) {
      return match?.map((it) => it.getValue(null)) ?? [];
    }
    return [];
  }
  @Bind
  async execute(gherkin: Step, args: unknown[], app: App): Promise<AutomationError | undefined> {
    // const args = this.getArgs(gherkin.text);
    if (gherkin.table) {
      if (!this.tablePrototype) {
        const error =
          new AutomationError(`Step '${this.title}' has a table but no table prototype was provided.

To define a table for this step, add a class reference to one of the tables, like HTable or VTable, to your step
definition as the last argument

Given('text', (table, app)=>{}, HTable)`);
        return error;
      }
      args.push(new this.tablePrototype(gherkin.table));
    }
    args.push(app);
    const error = await captureError(this.stepAction, ...args);
    if (error instanceof Error) {
      const message = `Step '${this.title}' failed with error
  
  ${error.message}`;
      const newError = new AutomationError(message);
      newError.opts = { cause: error };
      newError.stack = error.stack;
      return newError;
    }
  }

  @Bind
  run() {
    // do nothing
  }

  get idString() {
    return `${this.keyword}: ${this.expression}`;
  }
  get title() {
    return this.idString;
  }

  get isStepScope() {
    return true;
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
