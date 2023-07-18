import { Expression } from "@cucumber/cucumber-expressions";
import { GherkinDocString } from "./doc-string";
import { Builder, Property } from "@autometa/dto-builder";
import { StepType, StepKeyword } from "./enums";
import { CompiledDataTable } from "./datatables/compiled-data-table";

export class Step {
  @Property
  readonly keywordType: StepType;
  @Property
  readonly keyword: StepKeyword;
  @Property
  readonly text: string;
  @Property
  readonly docstring?: GherkinDocString;
  @Property
  readonly table?: CompiledDataTable;

  get hasDocstring() {
    return this.docstring !== undefined;
  }

  get hasTable() {
    return this.table !== undefined;
  }

  matches = (expression: Expression) => {
    return expression.match(this.text);
  };
}

export const StepBuilder = Builder(Step) 
