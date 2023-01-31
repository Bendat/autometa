import { ScenarioScope } from "../test-scopes/scenario-scope";
import { StepScope } from "../test-scopes/step-scope";
import { GherkinNode } from "./gherkin-node";
import { Scenario } from "./parser.types";
import { KeywordType, StepCache, StoredStep } from "./step-cache";
import { TestFunctions } from "./test-functions";
import { GherkinStep } from "./gherkin-steps";
import { DocString, StepKeywordType } from "@cucumber/messages";
import { getTableOrDocstring } from "./datatables/get-table-or-docstring";
import { compileDatatable, CompiledDataTable, TableType } from "./datatables/table-type";
import { Config } from "@config/config-manager";
import { FrameworkTestCall, Modifiers } from "./types";
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

  test(testFunctions: TestFunctions, app?: () => unknown): void {
    const steps = this.findMatchingSteps();
    this.runScenarioAsTest(testFunctions, steps, app);
  }
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

  private findMatchingSteps() {
    return this.steps.map((step) => {
      return {
        found: this.stepCache.find(step.keywordType ?? "Unknown", step.keyword, step.text),
        tableOrDocstring: step.tableOrDocstring as Docstring | CompiledDataTable | undefined,
      };
    });
  }

  private runScenarioAsTest(
    testFunctions: TestFunctions,
    steps: {
      found: { step: StoredStep; args: unknown[] };
      tableOrDocstring: Docstring | CompiledDataTable | undefined;
    }[],
    app?: () => unknown
  ) {
    const testFn = this.tagFilter(
      testFunctions.test as unknown as FrameworkTestCall,
      this.#modifier
    );
    testFn(this.getScenarioTitle(), async () => {
      const builtApp = app?.();

      for (const {
        found: { step, args },
        tableOrDocstring,
      } of steps) {
        const realArgs = getRealArgs(tableOrDocstring, args, builtApp, step.tableType);
        await step.execute(...realArgs);
      }
    });
  }

  private getScenarioTitle(): string {
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

function getRealArgs(
  tableOrDocstring: Docstring | CompiledDataTable | undefined,
  args: unknown[],
  app?: unknown,
  tableType?: TableType<unknown>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultTable: TableType<any> = Config.get("dataTables.default", {
    dataTables: { default: tableType },
  });
  const transformedTable =
    tableOrDocstring instanceof Docstring
      ? tableOrDocstring
      : tableOrDocstring
      ? new defaultTable(tableOrDocstring as CompiledDataTable)
      : undefined;

  let cucumberArgs = [...args];
  if (transformedTable) {
    cucumberArgs = [...args, transformedTable];
  }
  if (app) {
    return [...cucumberArgs, app];
  }
  return cucumberArgs;
}
