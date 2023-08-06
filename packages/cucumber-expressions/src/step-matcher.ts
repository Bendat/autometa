import { diffWordsWithSpace, Change } from "diff";
import { distance } from "closest-match";
import { Expression } from "@cucumber/cucumber-expressions";
import { AssertKey } from "@autometa/asserters";
import { StepKeyword, StepType } from "@autometa/types";
export interface Matchable {
  matches(text: string): boolean;
}

export interface ExpressionWrapper {
  expression: Expression;
}

export interface GherkinKeyword {
  type: StepType;
}
export type StepDiff = {
  merged: string;
  step: {
    keyword: StepKeyword;
    expression: Expression;
    type: StepType;
    matches: (text: string) => boolean;
  };
  gherkin: string;
  distance: number;
};
export type StepDiffs = StepDiff[];
export type LimitedStepDiffs = { same: StepDiffs; other: StepDiffs };
export function checkMatch<T extends Matchable>(text: string, it: T): boolean {
  return it.matches(text);
}
export function limitDiffs(
  sameStepType: StepDiff[],
  differentStepType: StepDiff[],
  max: number
) : LimitedStepDiffs {
  const sameDistances = sameStepType.map((it) => it.distance);
  const maxSameStepDistance = Math.max(...sameDistances);
  const otherStepDistance = differentStepType.map((it) => it.distance);
  const minDifferentStepDistance = Math.min(...otherStepDistance);
  // Prioritize same-type steps for search. Only
  // consider other-type steps when the lowest
  // other score is lower than the highest same scoreF
  if (maxSameStepDistance > minDifferentStepDistance) {
    const filter = sameStepType.filter(
      (it) => it.distance <= minDifferentStepDistance
    );
    if (filter.length >= max) {
      return { same: filter.slice(0, max), other: [] };
    }
    const diff = max - filter.length;
    const sameSlice = sameStepType.slice(0, diff);
    const differentSlice = differentStepType.slice(0, max - diff);
    return { same: sameSlice, other: differentSlice };
  }
  const maxIndex = Math.min(max, sameStepType.length);
  const result = { same: sameStepType.slice(0, maxIndex), other: [] };
  return result;
}

export function getDiffs<T extends Matchable & ExpressionWrapper>(
  text: string,
  maxResults: number,
  step: T[]
) {
  const sorted = step
    .map((it) => {
      if (checkMatch(text, it)) {
        return { merged: text, step: it, gherkin: text, distance: 0 };
      }
      AssertKey(it, "expression");
      AssertKey(it, "matches");
      const diff = getDiff(text, it);
      const refined = refineDiff(diff);
      const dist = distance(text, refined);
      return { merged: refined, step: it, gherkin: text, distance: dist };
    })
    .sort((a, b) => a.distance - b.distance);
  const max = Math.min(maxResults, sorted.length);
  return sorted.slice(0, max);
}

export function getDiff<T extends ExpressionWrapper>(text: string, it: T) {
  return diffWordsWithSpace(text, it.expression.source);
}

export function refineDiff(diff: Change[]) {
  const strings: string[] = [];
  for (let index = 0; index < diff.length; index++) {
    const gherkinChange = diff[index];
    const scopeChange = diff[index + 1];
    if (isExpressionCandidate(gherkinChange, scopeChange)) {
      strings.push(gherkinChange.value);
      index++;
      continue;
    }
    if (gherkinChange.value) {
      strings.push(gherkinChange.value);
      continue;
    }
  }
  return strings.join("");
}

export function isExpressionCandidate(change1: Change, change2: Change) {
  if (change1.removed && change2.added) {
    const scopeText = change2.value;
    return /{.*}/.test(scopeText);
  }
  return false;
}
