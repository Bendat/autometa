 import { Builder } from "@autometa/dto-builder";
import { GherkinNode } from "../gherkin-node";
import { Scenario } from "../scenario";

export class Examples extends GherkinNode {
  readonly keyword: string;
  readonly name: string;
  readonly description: string;
  readonly titles: readonly string[];
  readonly values: readonly string[][];
  declare children: Scenario[];
}

export class ExamplesBuilder extends Builder(Examples) {}
