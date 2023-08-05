import type { StringTransformer } from "./string-transformer";

export type StringTransformers = (() => StringTransformer)[];

export type TimeUnit =
  | "years"
  | "months"
  | "weeks"
  | "days"
  | "hours"
  | "minutes"
  | "seconds"
  | "milliseconds";

export type PhraseConverter = (
  key: string,
  ...transformers: StringTransformers
) => string;

export type FromPhraseFunction = <TObj, TReturn>(
  item: TObj,
  key: string,
  ...mutations: (() => StringTransformer)[]
) => TReturn;

export type CurriedFromPhraseFunction = <TReturn>(
  key: string,
  ...mutations: (() => StringTransformer)[]
) => TReturn;
