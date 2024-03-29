import { diffWordsWithSpace, Change } from "diff";
import { distance } from "closest-match";
import { CachedStep } from "./types";
export type StepDiff = {
  merged: string;
  step: CachedStep;
  gherkin: string;
  distance: number;
};
export type StepDiffs = StepDiff[];
export type LimitedStepDiffs = { same: StepDiffs; other: StepDiffs };
export function checkMatch(text: string, it: CachedStep): boolean {
  return it.matches(text);
}
export function limitDiffs(
  sameStepType: StepDiffs,
  differentStepType: StepDiffs,
  max: number
): LimitedStepDiffs {
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
  return { same: sameStepType.slice(0, maxIndex), other: [] };
}

function removeWhitespaceFromQuotedSubstrings(inputString: string): string {
  const regex = /(["'])([^"']*?)\1/g;
  let modifiedString = inputString;

  let match;
  while ((match = regex.exec(inputString))) {
    const quotedSubstring = match[0];
    const strippedSubstring = match[2].replace(/\s+/g, ""); // Remove whitespace
    modifiedString = modifiedString.replace(
      quotedSubstring,
      `${match[1]}${strippedSubstring}${match[1]}`
    );
  }

  return modifiedString;
}

export function getDiffs(text: string, maxResults: number, step: CachedStep[]) {
  const sorted = step
    .map((it) => {
      if (checkMatch(text, it)) {
        return { merged: text, step: it, gherkin: text, distance: 0 };
      }
      const collapsed = removeWhitespaceFromQuotedSubstrings(text);
      const diff = getDiff(collapsed, it);
      const refined = refineDiff(diff);
      const dist = distance(collapsed, refined);
      return { merged: refined, step: it, gherkin: text, distance: dist };
    })
    .sort((a, b) => a.distance - b.distance);
  const max = Math.min(maxResults, sorted.length);
  return sorted.slice(0, max);
}

export function getDiff(text: string, it: CachedStep) {
  return diffWordsWithSpace(text, it.expression.source);
}

export function refineDiff(diff: Change[]) {
  const strings: string[] = [];
  for (let index = 0; index < diff.length; index++) {
    const gherkinChange = diff[index];
    const scopeChange = diff[index + 1];
    if (isExpressionCandidate(gherkinChange, scopeChange)) {
      strings.push(gherkinChange.value);
      const extra = extractTextAfterPlaceholder(scopeChange.value);
      if (extra) {
        strings.push(extra);
      }
      index++;
      continue;
    }
    if (gherkinChange.removed === true) {
      continue;
    }
    if (gherkinChange.value) {
      strings.push(gherkinChange.value);

      continue;
    }
  }
  return strings.join("");
}

function extractTextAfterPlaceholder(inputString: string): string | null {
  // Define a regular expression to match the pattern
  const regex = /\{[^{}]+\}(.+)?/;

  // Use regex.exec to find a match in the input string
  const match = regex.exec(inputString);

  // Check if a match was found
  if (match && match[1]) {
    return match[1]; // Extract and trim the matched text (including leading spaces if present)
  } else {
    return null; // No match found or nothing after curly braces
  }
}

export function isExpressionCandidate(change1: Change, change2: Change) {
  if (change1 && change1.removed && change2 && change2.added) {
    const scopeText = change2.value;
    return /{.*}/.test(scopeText);
  }
  return false;
}
