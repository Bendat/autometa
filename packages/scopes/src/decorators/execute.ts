import { FeatureScope } from "../feature-scope";

export type OnFeatureExecuted = (
  feature: FeatureScope,
  callerFile: string
) => unknown;
