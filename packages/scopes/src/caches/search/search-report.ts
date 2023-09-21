import type { LimitedStepDiffs, StepDiff } from "./step-matcher";
import chalk from "colors-cli";
export class SameStepTypeMatch {
  readonly keyword: string;
  readonly text: string;
  readonly distance: number;
  constructor(diff: StepDiff) {
    this.keyword = diff.step.keyword;
    this.text = diff.merged;
    this.distance = diff.distance;
  }
  toString() {
    const keyword = chalk.green(this.keyword);
    const text = chalk.white(this.text);
    const distance = chalk.blue(`[${this.distance}]`);
    return `${distance} ${keyword} ${text}`;
  }
}
export class DifferentStepTypeMatch {
  readonly keyword: string;
  readonly text: string;
  readonly distance: number;
  constructor(diff: StepDiff) {
    this.keyword = diff.step.keyword;
    this.text = diff.merged;
    this.distance = diff.distance;
  }
  toString() {
    const keywordColor = chalk.cyan_bt;
    const keyword = keywordColor(this.keyword);
    const text = chalk.white(this.text);
    const distance = chalk.blue(`[${this.distance}]`);
    return `${distance} ${keyword} ${text}`;
  }
}
export class FuzzySearchReport {
  headingText: string;
  matches: (SameStepTypeMatch | DifferentStepTypeMatch)[] = [];
  children: FuzzySearchReport[] = [];
  constructor(readonly depth: number) {}
  get length() {
    const childLength: number = this.children
      .map((it) => it.length)
      .reduce<number>((a: number, b: number) => a + b, 0);
    return this.matches.length + childLength;
  }
  addHeading(headingText: string) {
    this.headingText = headingText;
    return this;
  }
  addMatch(match: SameStepTypeMatch | DifferentStepTypeMatch) {
    this.matches.push(match);
    return this;
  }
  addChild(child: FuzzySearchReport) {
    this.children.push(child);
    return this;
  }
  get #sameMatchTypes() {
    return this.matches.filter(
      (it) => it instanceof SameStepTypeMatch
    ) as SameStepTypeMatch[];
  }
  get #differentMatchTypes() {
    return this.matches.filter(
      (it) => it instanceof DifferentStepTypeMatch
    ) as DifferentStepTypeMatch[];
  }

  toString() {
    if (this.length === 0) {
      return "";
    }
    const same = this.#sameMatchTypes
      .filter((it) => it.distance < 10)
      .map((it) => it.toString())
      .join("\n");
    const sameMessage =
      same.length > 0 ? chalk.italic(`Steps with matching step type:`) : "";
    const different = this.#differentMatchTypes
      .filter((it) => it.distance < 10)
      .map((it) => it.toString())
      .join("\n");
    const differentMessage =
      different.length > 0
        ? chalk.italic(`Steps with different step type:`)
        : "";

    const messageArray: string[] = [];
    appendSubMessage(messageArray, sameMessage);
    appendSubMessage(messageArray, same);
    appendSubMessage(messageArray, differentMessage);
    appendSubMessage(messageArray, different);
    const children: FuzzySearchReport[] = [];
    this.children.forEach((child) => {
      appendChild(children, child);
    });
    const formatChildren: string = children
      .map((it) => it.toString())
      .join("\n")
    const message = messageArray.join(`\n`).trim();
    const heading = chalk.black(this.headingText);
    return `${heading ?? ""}
${message.replace(/\r\n|\n|\r/gm, `\n${TAB}`)}
${formatChildren.replace(/\r\n|\n|\r/gm, `\n${TAB}`)}`;
  }
}
function appendSubMessage(arr: string[], message: string, prefix?: string) {
  if (message && message.length > 0) {
    const str = prefix ? `${prefix ?? ""}${message ?? ""}` : message ?? "";
    arr.push(str);
  }
}
function appendChild(arr: FuzzySearchReport[], message: FuzzySearchReport) {
  if (message) {
    arr.push(message);
  }
}
const SPACE = " ";
const TAB = SPACE.repeat(2);

export function buildFuzzySearchReport(
  { same, other }: LimitedStepDiffs,
  depth: number
) {
  const report = new FuzzySearchReport(depth);
  same.forEach((diff) => {
    report.addMatch(new SameStepTypeMatch(diff));
  });
  other.forEach((diff) => {
    report.addMatch(new DifferentStepTypeMatch(diff));
  });
  return report;
}
