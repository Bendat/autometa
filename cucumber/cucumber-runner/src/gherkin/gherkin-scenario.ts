import { ScenarioScope } from "../test-scopes/scenario-scope";
import { StepScope } from "../test-scopes/step-scope";
import { GherkinNode } from "./gherkin-node";
import { Scenario } from "./parser.types";
import { KeywordType, StepCache } from "./step-cache";
import { GherkinStep } from "./gherkin-steps";
import { DocString, StepKeywordType } from "@cucumber/messages";
import { getTableOrDocstring } from "./datatables/get-table-or-docstring";
import { compileDatatable, CompiledDataTable } from "./datatables/table-type";
import { Modifiers } from "./types";
import { TableValue } from "./datatables/table-value";
import { Docstring } from "./doc-string";

export class GherkinScenario extends GherkinNode {
  tags: string[] = [];
  readonly steps: GherkinStep[] = [];
  #modifier?: Modifiers;
  constructor(
    readonly message: Scenario,
    readonly stepCache: StepCache,
    inheritedTags?: string[],
    readonly example?: { readonly key: string; readonly value: TableValue }[]
  ) {
    super();
    this.takeTags([...message.tags], ...(inheritedTags ?? []));
    this.loadFromGherkin(message, example);
  }
  get title() {
    return this.message.name ?? "";
  }
  get modifier(): Modifiers | undefined {
    return this.#modifier;
  }
  build = (scope: ScenarioScope) => {
    this.#modifier = scope.modifiers;
    scope.closedScopes.forEach((scope) => {
      if (scope instanceof StepScope) {
        const { keywordType, keyword, text, action, tableType } = scope;

        this.stepCache.add(keywordType, keyword, text, action, tableType);
      } else {
        throw new Error(`${scope.constructor.name}[${scope}] can not be defined inside a Scenario`);
      }
    });
  };

  private loadFromGherkin(
    message: Scenario,
    example: { readonly key: string; readonly value: TableValue }[] | undefined
  ) {
    for (const { keywordType, keyword, text, dataTable, docString } of message.steps) {
      const realText = interpolateStepText(text, example);
      const compiledTable = compileDatatable(dataTable);
      this.loadGherkinStep(compiledTable, docString, keywordType, keyword, realText);
    }
  }

  private loadGherkinStep(
    dataTable: CompiledDataTable | undefined,
    docString: DocString | undefined,
    keywordType: StepKeywordType | undefined,
    keyword: string,
    realText: string
  ) {
    const tableOrString = getTableOrDocstring(dataTable, docString);
    this.steps.push(
      new GherkinStep(keywordType as unknown as KeywordType, keyword, realText, tableOrString)
    );
  }

  findMatchingSteps() {
    return this.steps.map((step) => {
      return {
        found: this.stepCache.find(step.keywordType ?? "Unknown", step.keyword, step.text),
        tableOrDocstring: step.tableOrDocstring as Docstring | CompiledDataTable | undefined,
      };
    });
  }

  getScenarioTitle(): string {
    const scenarioTitle = this.example?.map(({ key, value }) => `${key}: ${value}`).join(", ");
    return `Scenario: ${this.message.name.trimStart()} ${
      scenarioTitle ? `<${scenarioTitle}>` : ""
    }`.trimEnd();
  }
}

function interpolateStepText(
  text: string,
  example: { readonly key: string; readonly value: TableValue }[] | undefined
) {
  let realText = text;
  if (example) {
    for (const { key, value } of example) {
      realText = realText.replace(`<${key}>`, `${value}`);
    }
  }
  return realText;
}