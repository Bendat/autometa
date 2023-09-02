import { GherkinDocString } from "./doc-string";
import { Builder, DtoBuilder, Property } from "@autometa/dto-builder";
import { Class } from "@autometa/types";
import { StepType, StepKeyword } from "./enums";
import { GherkinNode } from "../gherkin-node";
import { CompiledDataTable } from "./datatables";

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
}

export const StepBuilder: Class<DtoBuilder<Step>> = Builder(Step);
