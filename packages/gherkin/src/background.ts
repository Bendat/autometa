import { GherkinNode } from "./gherkin-node";
import { Builder, Property } from "@autometa/dto-builder";
import { Step } from "./steps";

export class Background extends GherkinNode {
  @Property
  readonly tags: readonly string[];
  @Property
  readonly keyword: string;
  @Property
  readonly name: string;
  @Property
  readonly description: string;
  @Property
  readonly steps: readonly Step[];
}

export const BackgroundBuilder = Builder(Background);
