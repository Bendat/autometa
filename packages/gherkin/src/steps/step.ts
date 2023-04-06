import { Expression } from "@cucumber/cucumber-expressions";
import { DocString } from "src/steps/doc-string";
import { StepType, StepKeyword } from "./types";
import { CompiledDataTable } from "./datatables";
import { Builder, Property } from "@autometa/dto-builder";

export class Step {
  @Property
  readonly keywordType: StepType;
  @Property
  readonly keyword: StepKeyword;
  @Property
  readonly text: string;
  @Property
  readonly docstring?: DocString;
  @Property
  readonly table?: CompiledDataTable;

  get hasDocstring() {
    return this.docstring !== undefined;
  }

  get hasTable() {
    return this.docstring !== undefined;
  }

  matches = (expression: Expression) => {
    return expression.match(this.text);
  };
}

export const StepBuilder = Builder(Step);
