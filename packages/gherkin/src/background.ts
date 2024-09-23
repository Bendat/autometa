import { GherkinNode } from "./gherkin-node";
import { Builder } from "@autometa/dto-builder";
import { Step } from "./steps";

export class Background extends GherkinNode {
  readonly keyword: string;
  readonly name: string;
  readonly description: string;
  declare readonly children: Step[];
  readonly lineNumber: number;

  get title() {
    return `${this.keyword}: ${this.name}`;
  }
}

export class BackgroundBuilder extends Builder(Background) {}
