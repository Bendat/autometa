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
    const text = chalk.white_b(this.text);
    const distance = chalk.blue(`[${this.distance}]`);
    return `${distance} ${keyword} ${text}`;
  }
}
export class FuzzySearchReport {
  headingText: string;
  matches: (SameStepTypeMatch | DifferentStepTypeMatch)[] = [];
  children: FuzzySearchReport[] = [];

  get length() {
    return (
      this.matches.length +
      this.children.length
    );
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
    const same = this.#sameMatchTypes.map((it) => it.toString()).join("\n");
    const sameMessage = same.length > 0 ? `Steps with matching step type:` : "";
    const different = this.#differentMatchTypes
      .map((it) => it.toString())
      .join("\n");
    const differentMessage =
      different.length > 0 ? `Steps with different step type:` : "";
    const messageArray: string[] = [];
    appendSubMessage(messageArray, sameMessage);
    appendSubMessage(messageArray, same, TAB);
    appendSubMessage(messageArray, differentMessage);
    appendSubMessage(messageArray, different, TAB);
    const children: FuzzySearchReport[] = [];
    this.children.forEach((child) => {
      appendChild(children, child);
    });
    const formatChildren: string = children
      .map((it) => it.toString().replace(/^/gm, " "))
      .join("\n");
    const message = messageArray.join(`\n${TAB}`);
    const heading = chalk.black_b(this.headingText);
    return `${heading}
${TAB}${message}
${formatChildren}`;
  }
}
function appendSubMessage(arr: string[], message: string, prefix?: string) {
  if (message && message.length > 0) {
    const str = prefix ? `${prefix}${message}` : message;
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

export function buildFuzzySearchReport({ same, other }: LimitedStepDiffs) {
  const report = new FuzzySearchReport();
  same.forEach((diff) => {
    report.addMatch(new SameStepTypeMatch(diff));
  });
  other.forEach((diff) => {
    report.addMatch(new DifferentStepTypeMatch(diff));
  });
  return report;
}
