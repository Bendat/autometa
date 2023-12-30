import { GherkinDocString } from "./doc-string";
import { Builder, DtoBuilder } from "@autometa/dto-builder";
import { StepType, StepKeyword } from "./enums";
import { GherkinNode } from "../gherkin-node";
import { CompiledDataTable } from "./datatables";

export class Step extends GherkinNode {
  readonly keywordType: StepType;
  readonly keyword: StepKeyword;
  readonly text: string;
  readonly docstring?: GherkinDocString;
  readonly table?: CompiledDataTable;

  get hasDocstring() {
    return this.docstring !== undefined;
  }

  get hasTable() {
    return this.table !== undefined;
  }
}

export const StepBuilder: DtoBuilder<Step> = Builder(Step);
