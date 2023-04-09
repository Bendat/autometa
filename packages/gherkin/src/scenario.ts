import { GherkinNode } from "./gherkin-node";
import { Builder, DtoBuilder, Property } from "@autometa/dto-builder";
import { Step } from "./steps";
import { Background } from "./background";
import { Class } from "@autometa/types";

export class Scenario extends GherkinNode {
  @Property
  readonly backgrounds: readonly [Background?, Background?];
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

export const ScenarioBuilder: Class<DtoBuilder<Scenario>> = Builder(Scenario);
