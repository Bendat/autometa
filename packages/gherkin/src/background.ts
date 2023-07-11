import { GherkinNode } from "./gherkin-node";
import { Builder, Property } from "@autometa/dto-builder";
import { Step } from "./steps";

export class Background extends GherkinNode {
  @Property
  readonly keyword: string;
  @Property
  readonly name: string;
  @Property
  readonly description: string;
  @Property
  readonly steps: readonly Step[];

  get title() {
    return `${this.keyword}: ${this.name}`;
  }
}

export class BackgroundBuilder extends Builder(Background){}
