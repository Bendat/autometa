import { Builder } from "@autometa/dto-builder";
import { GherkinNode, Background } from "..";
import { Examples } from ".";

export class ScenarioOutline extends GherkinNode {
  readonly name: string;
  readonly backgrounds: readonly [Background?, Background?];
  readonly keyword: string;
  declare children: Examples[];
}

export class ScenarioOutlineBuilder extends Builder(ScenarioOutline) {}
