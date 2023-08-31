import { Background, Scenario } from "@cucumber/messages";
import { GherkinNode } from "./gherkin-node";
import { GherkinScenario } from "./gherkin-scenario";
import type { Examples } from "./parser.types";
import { StepCache } from "./step-cache";
import type { Modifiers } from "./types";
export type ExamplesMessage = { examples: Examples; backgrounds: { background: Background }[] };
export class GherkinExamples extends GherkinNode {
  get modifier(): Modifiers | undefined {
    throw new Error("Method not implemented.");
  }
  readonly tags: string[] = [];

  readonly headers: string[];
  readonly rows: string[][];
  readonly scenarios: GherkinScenario[] = [];

  constructor(
    readonly message: ExamplesMessage,
    readonly scenario: Scenario,
    inheritedTags: string[],
    stepCache: StepCache
  ) {
    super();
    this.takeTags([...message.examples.tags], ...inheritedTags);
    this.headers = this.message.examples.tableHeader?.cells.map((it) => it.value) ?? [];
    this.rows = this.message.examples.tableBody.map(({ cells }) => cells.map(({ value }) => value));
    for (const row of this.rows) {
      const scenarioExample = row.map((it, idx) => ({
        key: this.headers[idx],
        value: it,
      }));
      this.scenarios.push(new GherkinScenario({ scenario }, stepCache, this.tags, scenarioExample));
    }
  }
  get length() {
    return this.rows.length;
  }
}
