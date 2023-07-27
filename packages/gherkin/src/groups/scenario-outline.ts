import { Builder, Property } from "@autometa/dto-builder";
import { GherkinNode, Background } from "..";
import { Examples } from ".";

export class ScenarioOutline extends GherkinNode {
  @Property
  readonly name: string;
  @Property
  readonly backgrounds: readonly [Background?, Background?];
  @Property
  readonly keyword: string;
  @Property
  declare children: Examples[];
}

export class ScenarioOutlineBuilder extends Builder(ScenarioOutline) {}
