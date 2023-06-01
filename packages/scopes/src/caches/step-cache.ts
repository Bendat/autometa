import { Bind } from "@autometa/bind-decorator";
import { StepKeyword, StepType } from "@autometa/gherkin";
import { StepScope } from "../step-scope";
import { closestMatch } from "closest-match";
import { DataTable } from "@autometa/gherkin";
type CachedStep = StepScope<string, DataTable>;
export class StepCache {
  private Context: CachedStep[] = [];
  private Action: CachedStep[] = [];
  private Outcome: CachedStep[] = [];
  private Conjunction: CachedStep[] = [];
  private Unknown: CachedStep[] = [];
  private keySet = new Map<string, Set<string>>([
    ["Action", new Set<string>()],
    ["Context", new Set<string>()],
    ["Outcome", new Set<string>()],
    ["Conjunction", new Set<string>()],
    ["Unknown", new Set<string>()],
  ]);
  private stepCount = 0;

  get size() {
    return this.stepCount;
  }

  constructor(readonly parent?: StepCache) {}

  @Bind
  add(step: CachedStep) {
    const {
      keywordType,
      keyword,
      expression: text,
    } = step as CachedStep;
    const textStr = text.source;
    if (this.find(keywordType, keyword, textStr, false)) {
      throw new Error(`Step [${keyword} ${textStr}] already defined`);
    }
    this.keySet.get(keywordType)?.add(textStr);
    this[keywordType].push(step as CachedStep);
    this.stepCount++;
  }

  find(
    keywordType: StepType,
    keyword: string,
    text: StepKeyword
  ): { step: CachedStep; args: unknown[] };
  find(
    keywordType: StepType,
    keyword: StepKeyword,
    text: string,
    throwOnNotFound?: boolean
  ): { step: CachedStep; args: unknown[] } | undefined;
  @Bind
  find(
    keywordType: StepType,
    keyword: StepKeyword,
    text: string,
    throwOnNotFound = true
  ): { step: CachedStep; args: unknown[] } | undefined {
    let bucket = this[keywordType];
    let step = bucket.find((it) => it.matches(text));
    let args: unknown[] = [];

    if (step) {
      args = step.getArgs(text);
      return { step: step, args: args ?? [] };
    }

    if (!step && (keywordType === "Conjunction" || keywordType === "Unknown")) {
      bucket = [...this.Context, ...this.Action, ...this.Outcome];
      step = bucket.find((it) => it.matches(text));
      args = step?.getArgs(text) ?? [];
    }

    if (!step) {
      ({ found: step, args } = this.searchParent(
        keywordType,
        keyword,
        text,
        step,
        args
      ));
    }

    if (!step && throwOnNotFound) {
      const closestMatch = this.findClosest(keywordType, keyword, text);
      throw new Error(
        `No stored step could be found matching [${keyword} ${text}]${closestMatch}`
      );
    }

    if (!step) {
      return undefined;
    }

    return { step: step, args };
  }

  private findClosest(stepType: StepType, keyword: StepKeyword, text: string) {
    const list = [...(this.keySet.get(stepType) ?? [])];
    const closest = closestMatch(text, list, true);
    if (Array.isArray(closest)) {
      const mapped = closest.map((match) => `${keyword} ${match}`);
      return `\nDid you mean ${mapped} ?`;
    }
    return "";
  }

  private searchParent(
    keywordType: StepType,
    keyword: StepKeyword,
    text: string,
    found: CachedStep | undefined,
    args: unknown[]
  ) {
    const parentFound = this.parent?.find(keywordType, keyword, text, false);
    if (parentFound) {
      found = parentFound.step;
      args = parentFound.args;
    }
    return { found, args };
  }
}
