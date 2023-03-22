import { ScenarioScope } from "../test-scopes/scenario-scope";
import { StepScope } from "../test-scopes/step-scope";
import { GherkinNode } from "./gherkin-node";
import { Scenario } from "./parser.types";
import { KeywordType, StepCache } from "./step-cache";
import { GherkinStep } from "./gherkin-steps";
import { Background, DocString, StepKeywordType } from "@cucumber/messages";
import { getTableOrDocstring } from "./datatables/get-table-or-docstring";
import { compileDatatable, CompiledDataTable } from "./datatables/table-type";
import { Modifiers } from "./types";
import { TableValue } from "./datatables/table-value";
import { Docstring } from "./doc-string";
import crypto from "crypto";
export type ScenarioMessage = { scenario: Scenario; backgrounds?: Background[] };
export class GherkinScenario extends GherkinNode {
  tags: string[] = [];
  readonly steps: GherkinStep[] = [];
  readonly backgroundSteps: GherkinStep[] = [];
  #modifier?: Modifiers;
  constructor(
    readonly message: ScenarioMessage,
    readonly stepCache: StepCache,
    inheritedTags?: string[],
    readonly example?: { readonly key: string; readonly value: TableValue }[],
    private exampleIdx?: number
  ) {
    super();
    this.takeTags([...message.scenario.tags], ...(inheritedTags ?? []));
    this.loadFromGherkin(message, example);
  }
  get id() {
    const idTag =
      this.exampleIdx !== undefined
        ? `${this.message.scenario.name}:${this.exampleIdx}`
        : `${this.message.scenario.name}`;
    return crypto.createHash("md5").update(idTag).digest("hex");
  }
  get title() {
    return this.message.scenario.name ?? "";
  }
  get description() {
    return this.message.scenario.description;
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
    message: ScenarioMessage,
    example: { readonly key: string; readonly value: TableValue }[] | undefined
  ) {
    const backgrounds = message.backgrounds ?? [];
    for (const background of backgrounds) {
      if(!background){
        continue
      }
      for (const { keywordType, keyword, text, dataTable, docString } of background?.steps ?? []) {
        const realText = interpolateStepText(text, example);
        const compiledTable = compileDatatable(dataTable);
        this.loadGherkinStep(
          compiledTable,
          docString,
          keywordType,
          keyword,
          realText,
          this.backgroundSteps
        );
      }
    }

    for (const { keywordType, keyword, text, dataTable, docString } of message.scenario.steps) {
      const realText = interpolateStepText(text, example);
      const compiledTable = compileDatatable(dataTable);
      this.loadGherkinStep(compiledTable, docString, keywordType, keyword, realText, this.steps);
    }
  }

  private loadGherkinStep(
    dataTable: CompiledDataTable | undefined,
    docString: DocString | undefined,
    keywordType: StepKeywordType | undefined,
    keyword: string,
    realText: string,
    source: GherkinStep[]
  ) {
    const tableOrString = getTableOrDocstring(dataTable, docString);
    source.push(
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
  findMatchingBackgroundSteps() {
    return this.backgroundSteps.map((step) => {
      return {
        found: this.stepCache.find(step.keywordType ?? "Unknown", step.keyword, step.text),
        tableOrDocstring: step.tableOrDocstring as Docstring | CompiledDataTable | undefined,
      };
    });
  }
  getScenarioTitle(): string {
    const scenarioTitle = this.example?.map(({ key, value }) => `${key}: ${value}`).join(", ");
    return `Scenario: ${this.message.scenario.name.trimStart()} ${
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