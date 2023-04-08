import { Rule } from "../groups/rule";
import { Scenario } from "../scenario";
import { ScenarioOutline } from "../groups/scenario-outline";
import { Background } from "../background";

export type FeatureChildType = Background | Rule | ScenarioOutline | Scenario;
export type RuleChildType = Background | ScenarioOutline | Scenario;
