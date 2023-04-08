import { Builder, Property } from "@autometa/dto-builder";
import { GherkinNode, Background } from "..";
import { Examples } from ".";

export class ScenarioOutline extends GherkinNode {
  @Property
  name: string;
  @Property
  readonly backgrounds: readonly [Background?, Background?];
  @Property
  readonly keyword: string;
  @Property
  readonly examples: Examples[];
}

export const ScenarioOutlineBuilder = Builder(ScenarioOutline);
