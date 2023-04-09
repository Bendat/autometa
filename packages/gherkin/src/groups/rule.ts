import { ScenarioOutline } from "./scenario-outline";
import { Scenario } from "../scenario";
import { GherkinNode } from "../gherkin-node";
import { Builder, DtoBuilder, Property } from "@autometa/dto-builder";
import { Background } from "../background";
import { Class } from "@autometa/types";

export class Rule extends GherkinNode {
  @Property
  childer: Array<Background | Scenario | ScenarioOutline> = [];
  @Property
  keyword: string;
  @Property
  name: string;
  @Property
  description: string;
}

export const RuleBuilder: Class<DtoBuilder<Rule>> = Builder(Rule);
