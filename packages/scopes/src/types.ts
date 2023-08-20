import { App } from "@autometa/app";
import {
  DataTable,
  NeverDataTable,
  DataTableDocument
} from "@autometa/gherkin";
export type FeatureAction = () => void;
export type RuleAction = () => void;
export type ScenarioAction = () => void;
export type BackgroundAction = () => void;
export type StepText = string | RegExp;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawStepAction = (...args: unknown[]) => unknown | Promise<unknown>;
export type HookAction = (...args: HookArguments) => unknown | Promise<unknown>;

export type StepArguments = [...unknown[], App] | [App];

export type InferredArguments<T extends StepArguments = [App]> = T extends [
  ...infer THead,
  infer TTail
]
  ? TTail extends App
    ? [...THead, App]
    : "The last argument passed must be type 'App'"
  : [App];
export type HookArguments = [App];

export interface Types {
  [key: string]: unknown;
  string: string;
  word: string;
  number: number;
  float: number,
  int: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any: any,
  unknown: unknown
  boolean: boolean;
  bool: boolean;
  date: Date;
  primitive: string | number | boolean | Date;
}

interface ExpressionFn<TAccumulator extends unknown[], TTable> {
  (...args: AccumulatorWithKnownTableTable<TAccumulator, TTable>):
    | unknown
    | Promise<unknown>;
}

type AccumulatorWithKnownTableTable<TAcc, TTable> = TAcc extends [
  ...infer THead,
  infer TTail
]
  ? TTable extends NeverDataTable
    ? [...THead, TTail]
    : [...THead, TTable, TTail]
  : never;

type ErrorString<TArg extends string> =
  `unknown expression type [${TArg}]. Please update your Types interface to map [${TArg}] to some other type..`;

export type StepWithExpressionArgs<
  T,
  TTable,
  TAccumulator extends unknown[] = []
> = T extends `${infer _prefix}{${infer TArg}}${infer TRemainder}`
  ? TArg extends keyof Types
    ? StepWithExpressionArgs<TRemainder, TTable, [...TAccumulator, Types[TArg]]>
    : StepWithExpressionArgs<`unknown expression ${TArg}`, TTable, TAccumulator>
  : T extends `unknown expression ${infer TArg}`
  ? ExpressionFn<[...TAccumulator, ErrorString<TArg>], TTable>
  : ExpressionFn<[...TAccumulator, App], TTable>;

export type StepAction<T extends string, TTable> = StepWithExpressionArgs<
  T,
  TTable
>;

export type StepTableArg = DataTable | DataTableDocument<DataTable>;
