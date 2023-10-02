import { Expression } from "@cucumber/cucumber-expressions";

export type CachedStep = {
  keyword: string;
  type: string;
  expression: Expression;
  matches: (text: string) => boolean;
};
