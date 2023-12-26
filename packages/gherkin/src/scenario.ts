import { GherkinNode } from "./gherkin-node";
import { Builder } from "@autometa/dto-builder";
import { Step } from "./steps";
import { Background } from "./background";

export class Scenario extends GherkinNode {
  readonly backgrounds: readonly [Background?, Background?];
  readonly keyword: string;
  readonly name: string;
  readonly description: string;
  declare children: Step[];

  get title() {
    return `${this.keyword}: ${this.name}`;
  }
}

export class ScenarioBuilder extends Builder(Scenario) {}
