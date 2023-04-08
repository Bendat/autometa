export type FeatureAction = () => void;
export type ScenarioAction = () => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StepAction = (...args: any[]) => void | Promise<void>;
