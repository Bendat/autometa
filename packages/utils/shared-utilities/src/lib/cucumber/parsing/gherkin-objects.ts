import { Step } from '@cucumber/messages';

export class GherkinTest {
  constructor(
    public readonly language: string,
    public readonly feature: GherkinFeature
  ) {}
}

export class GherkinFeature {
  constructor(
    public readonly title: string,
    public readonly description: string | undefined,
    public readonly backgrounds: GherkinBackground[],
    public readonly rules: GherkinRule[],
    public readonly scenarios: GherkinScenario[],
    public readonly outlines: GherkinScenarioOutline[],
    public readonly tags: string[]
  ) {}
}

export class GherkinBackground {
  public constructor(
    public readonly title: string | undefined,
    public readonly steps: GherkinSteps
  ) {}
}

export class GherkinRule {
  public constructor(
    public readonly title: string,
    public readonly description: string | undefined,
    public readonly backgrounds: GherkinBackground[],
    public readonly scenarios: GherkinScenario[],
    public readonly outlines: GherkinScenarioOutline[],
    public readonly tags: string[]
  ) {}
}

export class GherkinScenario {
  public constructor(
    public readonly title: string | undefined,
    public readonly description: string | undefined,
    public readonly steps: GherkinSteps,
    public readonly rule: string | undefined,
    public readonly tags: string[]
  ) {}
}

export class GherkinScenarioOutline {
  constructor(
    public title: string | undefined,
    public readonly description: string | undefined,
    public steps: GherkinStepBlueprints,
    public examples: GherkinExample[],
    public scenarios: GherkinScenario[],
    public readonly tags: string[],
    public rule?: string
  ) {}
}

export class GherkinStepBluePrint {
  constructor(
    public readonly keyword: string,
    public readonly text: string,
    public readonly table?: GherkinTable
  ) {}
}

export class GherkinStep {
  constructor(
    public readonly keyword: string,
    public readonly text: string,
    public readonly variables: string[],
    public readonly table?: GherkinTable
  ) {}

  tosString() {
    return `Step({ keyword: ${this.keyword}, text: ${this.text} })`;
  }
}

export type GherkinSteps = GherkinStep[];

export type GherkinStepBlueprints = GherkinStepBluePrint[];

export class GherkinTable {
  constructor(
    public readonly titles: string[],
    public readonly rows: GherkinTableRow
  ) {}
}

export type GherkinTableRow = string[][];

export class FlatTestSpec {
  constructor(
    public readonly backgrounds: GherkinBackground[],
    public readonly scenarios: GherkinScenario[],
    public readonly scenarioOutlines: GherkinScenarioOutline[]
  ) {}
}

export class GherkinExample {
  constructor(
    public readonly headers: string[],
    public readonly values: string[][]
  ) {}
}

export class StepsGroup {
  constructor(public readonly steps: Step[]) {}
}
