import { ArrayElement } from "@autometa/types";
import { StepKeywords, StepTypes } from "./enums";

export type StepType = ArrayElement<typeof StepTypes>;
export type StepKeyword = ArrayElement<typeof StepKeywords>;
