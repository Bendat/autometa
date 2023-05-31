export type FeatureAction = () => void;
export type RuleAction = () => void;
export type ScenarioAction = () => void;
export type StepText = string | RegExp;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StepAction = (...args: any[]) => unknown | Promise<unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HookAction = (...args: any[]) => unknown | Promise<unknown>;
