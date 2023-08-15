import { Bind } from "@autometa/bind-decorator";
import { StepKeyword, StepType } from "@autometa/gherkin";
import { CachedStep } from "./types";
import { AutomationError } from "@autometa/errors";
import { getDiffs, limitDiffs } from "./search/step-matcher";
import { FuzzySearchReport, buildFuzzySearchReport } from "./search";
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
    ["Unknown", new Set<string>()]
  ]);
  private stepCount = 0;

  get size() {
    return this.stepCount;
  }

  constructor(readonly scopeName?: string, readonly parent?: StepCache) {}

  @Bind
  add(step: CachedStep) {
    const { type: keywordType, keyword, expression: text } = step as CachedStep;
    const textStr = text.source;
    if (this.find(keywordType, keyword, textStr, false)) {
      throw new AutomationError(`Step [${keyword} ${textStr}] already defined`);
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
  ): { step: CachedStep; args: unknown[] };
  @Bind
  find(
    keywordType: StepType,
    keyword: StepKeyword,
    text: string,
    throwOnNotFound = true
  ) {
    errorOnUndefined(keywordType, keyword, text);
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
    this.throwOnNotFound(step, throwOnNotFound, keywordType, keyword, text);

    ({ found: step, args } = this.searchParent(
      keywordType,
      keyword,
      text,
      step,
      args
    ));

    if (step) {
      return { step: step, args };
    }
  }

  private throwOnNotFound(
    step: CachedStep | undefined,
    throwOnNotFound: boolean,
    keywordType: StepType,
    keyword: string,
    text: string
  ) {
    if (!step && !this.parent && throwOnNotFound) {
      const report = this.startFuzzySearch(keywordType, text);
      const fmt = formatReport(report);
      throw new AutomationError(
        `No stored step could be found matching [${keyword} ${text}]${fmt}`
      );
    }
  }
  private startFuzzySearch(keywordType: StepType, text: string) {
    const closestMatches = this.findClosest(keywordType, text);
    const report = buildFuzzySearchReport(closestMatches);
    if (this.scopeName) report.addHeading(this.scopeName);
    if (this.parent) {
      const parentReport = this.parent.startFuzzySearch(keywordType, text);
      parentReport.addChild(report);
    }
    return report;
  }

  private findClosest(stepType: StepType, text: string) {
    const ofType = this.#findClosestOfType(stepType, text);
    const ofAll = this.#findClosestOfAll(stepType, text);
    return limitDiffs(ofType, ofAll, 5);
  }

  #findClosestOfType(stepType: StepType, text: string) {
    const list = this[stepType];
    return getDiffs(text, 5, list);
  }

  #findClosestOfAll(ignoreStepType: StepType, text: string) {
    const cache: CachedStep[] = [];
    this.#gatherSteps("Context", ignoreStepType, cache);
    this.#gatherSteps("Action", ignoreStepType, cache);
    this.#gatherSteps("Outcome", ignoreStepType, cache);
    this.#gatherSteps("Conjunction", ignoreStepType, cache);
    this.#gatherSteps("Unknown", ignoreStepType, cache);
    return getDiffs(text, 5, cache);
  }

  #gatherSteps(
    stepType: StepType,
    ignoreStepType: StepType,
    accumulator: CachedStep[]
  ) {
    if (stepType === ignoreStepType) {
      return;
    }
    accumulator.push(...this[stepType]);
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

function formatReport(report: FuzzySearchReport) {
  if (report.length <= 0) {
    return "";
  }
  return `\n* Some potential matches were found:\n${report.toString()}`;
}

function errorOnUndefined(keywordType: string, keyword: string, text: string) {
  if (!keywordType) {
    throw new AutomationError(
      `keywordType is required but was undefined for keyword ${keyword} and text ${text}`
    );
  }
  if (!keyword) {
    throw new AutomationError(
      `keyword is required but was undefined for keyword type ${keywordType} and text ${text}`
    );
  }
  if (!text) {
    throw new AutomationError(
      `gherkin step text is required but was undefined for keyword type ${keywordType} and keyword ${keyword}`
    );
  }
}
