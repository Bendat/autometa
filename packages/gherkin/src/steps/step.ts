import { Expression } from "@cucumber/cucumber-expressions";
import { GherkinDocString } from "./doc-string";
import { DataTable } from "./datatables";
import { Builder, DtoBuilder, Property } from "@autometa/dto-builder";
import { Class } from "@autometa/types";
import { StepType, StepKeyword } from "./enums";
import { GherkinNode } from "../gherkin-node";
import { CompiledDataTable } from "./datatables-old";

export class Step extends GherkinNode{
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

export const StepBuilder: Class<DtoBuilder<Step>> = Builder(Step);
