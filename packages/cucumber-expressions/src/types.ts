import type { Expression } from "@cucumber/cucumber-expressions";

export interface CachedStep {
  readonly keyword: string;
  readonly type: string;
  readonly expression: Expression;
  matches(text: string): boolean;
}

export interface StepDiff {
  readonly merged: string;
  readonly step: CachedStep;
  readonly gherkin: string;
  readonly distance: number;
}

export type StepDiffList = StepDiff[];

export interface LimitedStepDiffs {
  readonly matchingType: StepDiffList;
  readonly otherTypes: StepDiffList;
}
