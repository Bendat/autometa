import { Expression } from "@cucumber/cucumber-expressions";
import { DocString } from "./doc-string";
import { CompiledDataTable } from "./datatables";
import { Builder, DtoBuilder, Property } from "@autometa/dto-builder";
import { Class } from "@autometa/types";
import { StepType, StepKeyword } from "./enums";

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
    return this.table !== undefined;
  }

  matches = (expression: Expression) => {
    return expression.match(this.text);
  };
}

export const StepBuilder: Class<DtoBuilder<Step>> = Builder(Step);
