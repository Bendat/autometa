import { GherkinDocString } from "./doc-string";
import { Builder } from "@autometa/dto-builder";
import { StepType, StepKeyword } from "./enums";
import { GherkinNode } from "../gherkin-node";
import { CompiledDataTable } from "./datatables";

export class Step extends GherkinNode {
  readonly keywordType: StepType;
  readonly keyword: StepKeyword;
  readonly text: string;
  readonly docstring?: GherkinDocString;
  readonly table?: CompiledDataTable;
  readonly lineNumber: number;
  get hasDocstring() {
    return this.docstring !== undefined;
  }

  get hasTable() {
    return this.table !== undefined;
  }
}

export class StepBuilder extends Builder(Step) {}
