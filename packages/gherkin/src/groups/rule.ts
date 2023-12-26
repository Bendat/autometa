import { ScenarioOutline } from "./scenario-outline";
import { Scenario } from "../scenario";
import { GherkinNode } from "../gherkin-node";
import { Builder } from "@autometa/dto-builder";
import { Background } from "../background";

export class Rule extends GherkinNode {
  declare children: Array<Background | Scenario | ScenarioOutline>;
  keyword: string;
  name: string;
  description: string;
}

export class RuleBuilder extends Builder(Rule) {}
