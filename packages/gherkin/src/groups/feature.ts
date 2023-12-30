import { Builder } from "@autometa/dto-builder";
import { Background } from "../background";
import { Rule } from ".";
import { GherkinNode } from "../gherkin-node";
import { ScenarioOutline } from "./scenario-outline";
import { Scenario } from "../scenario";

export class Feature extends GherkinNode {
  children: Array<Rule | Background | Scenario | ScenarioOutline> = [];
  readonly uri: string;
  readonly name: string;
  readonly language: string;
  readonly keyword: string;
  readonly description: string;
}

export class FeatureBuilder extends Builder(Feature) {}
