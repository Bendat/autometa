import { Scenario } from "@cucumber/messages";
import { TableValue } from "./datatables/table-value";
import { transformTableValue } from "./datatables/transform-table-value";
import { GherkinNode } from "./gherkin-node";
import { GherkinScenario } from "./gherkin-scenario";
import { Examples } from "./parser.types";
import { StepCache } from "./step-cache";
import { Modifiers } from "./types";

export class GherkinExamples extends GherkinNode {
  get modifier(): Modifiers | undefined {
    throw new Error("Method not implemented.");
  }
  readonly tags: string[] = [];

  readonly headers: string[];
  readonly rows: TableValue[][];
  readonly scenarios: GherkinScenario[] = [];

  constructor(
    readonly message: Examples,
    readonly scenario: Scenario,
    inheritedTags: string[],
    stepCache: StepCache
  ) {
    super();
    this.takeTags([...message.tags], ...inheritedTags);
    this.headers = this.message.tableHeader?.cells.map((it) => it.value) ?? [];
    this.rows = this.message.tableBody.map((it) =>
      it.cells.map((cell) => transformTableValue(cell.value))
    );
    for (const row of this.rows) {
      const scenarioExample = row.map((it, idx) => ({
        key: this.headers[idx],
        value: it,
      }));
      this.scenarios.push(new GherkinScenario(scenario, stepCache, this.tags, scenarioExample));
    }
  }
  get length() {
    return this.rows.length;
  }
}
