import { StepScope } from "..";
import { StepCache } from ".";
import { DataTable } from "@autometa/gherkin";
export type CachedStep = StepScope<string, DataTable | undefined>;
export type CurriedStepCache = new (parent: StepCache) => StepCache;
