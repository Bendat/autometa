import { Property, Builder, DtoBuilder } from "@autometa/dto-builder";
import { Background } from "../background";
import { Rule } from ".";
import { GherkinNode } from "../gherkin-node";
import { ScenarioOutline } from "./scenario-outline";
import { Scenario } from "../scenario";
import { Class } from "@autometa/types";

export class Feature extends GherkinNode {
  children: Array<Rule | Background | Scenario | ScenarioOutline> = [];
  @Property
  readonly uri?: string;
  @Property
  readonly name: string;
  @Property
  readonly language: string;
  @Property
  readonly keyword: string;

  @Property
  readonly description: string;
}

export const FeatureBuilder: Class<DtoBuilder<Feature>> = Builder(Feature);