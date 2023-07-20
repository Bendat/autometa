import type { StepAction, StepTableArg } from "./types";
import { Scope } from "./scope";
import {
  DataTable,
  DataTableDocument,
  Step,
  StepKeyword,
  StepType,
  getDocumentTable
} from "@autometa/gherkin";
import { App } from "@autometa/app";
import { Bind } from "@autometa/bind-decorator";
import { AutomationError } from "@autometa/errors";
import { Class } from "@autometa/types";
import { Expression } from "@cucumber/cucumber-expressions";
import { HookCache } from "./caches/hook-cache";
import { StepCache } from "./caches";
import { Empty_Function } from "./novelties";
import { captureError } from "./capture-error";

export class StepScope<
  TText extends string,
  TTable extends StepTableArg | undefined
> extends Scope {
  canHandleAsync = true;
  action = Empty_Function;
  constructor(
    readonly keyword: StepKeyword,
    readonly keywordType: StepType,
    public readonly expression: Expression,
    public readonly stepAction: StepAction<TText, TTable>,
    readonly tablePrototype?: Class<TTable>
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
  async buildArgs(
    gherkin: Step,
    args: unknown[],
    app: App
  ): Promise<AutomationError | undefined> {
    // const args = this.getArgs(gherkin.text);
    const title = this.stepText(gherkin.text);
    const gotArgs = this.getArgs(gherkin.text);
    args.push(...gotArgs);
    if (gherkin.table) {
      if (!this.tablePrototype) {
        const error =
          new AutomationError(`Step '${title}' has a table but no table prototype was provided.

To define a table for this step, add a class reference to one of the tables, like HTable or VTable, to your step
definition as the last argument

Given('text', (table, app)=>{}, HTable)`);
        return error;
      }
      if (this.tablePrototype.prototype instanceof DataTable) {
        args.push(new this.tablePrototype(gherkin.table));
      } else if (this.tablePrototype.prototype instanceof DataTableDocument) {
        const type = this.tablePrototype.prototype
        const tableType = getDocumentTable(type);
        const table = new tableType(gherkin.table);
        args.push(new this.tablePrototype(table));
        throw new Error('FIX: this should be an array of documents in the end')
      } else {
        const message = `Step '${title}' has a table but the table prototype provided is not a DataTable or DataTableDocument`;
        throw new AutomationError(message);
      }
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
    return `${this.keyword} ${this.expression.source}`;
  }
  @Bind
  stepText(gherkinText: string) {
    return `${this.keyword} ${gherkinText}`;
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
