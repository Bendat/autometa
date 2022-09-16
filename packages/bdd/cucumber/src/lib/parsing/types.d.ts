import { Step } from '@cucumber/messages';

export interface GherkinTest {
  language: string;
  feature: GherkinFeature;
}

export interface GherkinFeature {
  name: string;
  backgrounds: GherkinBackground[];
  rules: GherkinRule[];
  scenarios: GherkinScenario[];
  outlines: GherkinScenarioOutline[];
}

export interface GherkinBackground {
  name?: string;
  steps: GherkinSteps;
}

export interface GherkinRule {
  name?: string;
  backgrounds: GherkinBackground[];
  scenarios: GherkinScenario[];
  outlines: GherkinScenarioOutline[];
}

export interface GherkinScenario {
  name?: string;
  steps: GherkinSteps;
  rule?: string;
}

export interface GherkinScenarioOutline {
  name?: string;
  steps: GherkinSteps;
  examples: GherkinExample[];
  rule?: string;
}

export interface GherkinStep {
  keyword: string;
  text: string;
  variables: string[];
  table?: GherkinTable;
}

export type GherkinSteps = GherkinStep[];

export interface GherkinTable {
  titles: string[];
  rows: GherkinTableRow;
}

type GherkinTableRow = string[][];

export interface FlatTestSpec {
  backgrounds: GherkinBackground[];
  scenarios: GherkinScenario[];
  scenarioOutlines: GherkinScenarioOutline[];
}

export interface GherkinExample {
  headers: string[];
  values: string[][];
}

export interface StepsGroup {
  steps: Step[];
}
