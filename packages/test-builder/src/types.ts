import { Feature } from "@autometa/gherkin";
import { GherkinNode } from "@autometa/gherkin";
import { Scope, ScenarioScope, StepScope } from "@autometa/scopes";
import { App } from "@autometa/app";
import { Step } from "@autometa/gherkin";
import { Scenario } from "@autometa/gherkin";
import { ScenarioOutline } from "@autometa/gherkin";
import { FeatureScope } from "@autometa/scopes";

type HookFunction = (app: App) => unknown | Promise<unknown>;
export type HookWrapper = (...args: unknown[]) => unknown | Promise<unknown>;
export type TimeoutFunction = (ms: number) => void;
export type ExternalHooks = {
  beforeAll: HookFunction;
  beforeEach: HookFunction;
  afterAll: HookFunction;
  afterEach: HookFunction;
};
export type ExternalHookWrappers = {
  beforeAll: HookWrapper;
  beforeEach: HookWrapper;
  afterAll: HookWrapper;
  afterEach: HookWrapper;
};
export type Groups = "Feature" | "Rule" | "Scenario Outline" | "Examples";
export type GroupData = {
  gherkin: GherkinNode;
  scope?: Scope;
};
export type FeatureData = {
  gherkin: Feature;
  scope: FeatureScope;
};
export type TestData = {
  gherkin: Scenario | ScenarioOutline;
  scope?: ScenarioScope;
};
export type StepData = {
  gherkin: Step;
  scope: StepScope;
};

export type OnFailure = () => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TestGroup = ((
  title: string,
  action: (...args: any[]) => void
) => void) & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  skip: (title: string, action: (...args: any[]) => void) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  only: (title: string, action: (...args: any[]) => void) => void;
};
