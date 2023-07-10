import { Builder, Property } from "@autometa/dto-builder";
import { GherkinNode } from "../gherkin-node";
import { Scenario } from "../scenario";

export class Examples extends GherkinNode {
  @Property
  readonly keyword: string;
  @Property
  readonly name: string;
  @Property
  readonly description: string;
  @Property
  readonly titles: readonly string[];
  @Property
  readonly values: readonly string[][];
  @Property
  readonly children: readonly Scenario[];
}

export class ExamplesBuilder extends Builder(Examples){}
