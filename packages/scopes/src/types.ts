import type { App } from "@autometa/app";
import type {
  DataTable,
  NeverDataTable,
  TableDocument,
} from "@autometa/gherkin";
import type { Timeout } from "./timeout";
export type FeatureAction = () => void;
export type RuleAction = () => void;
export type ScenarioAction = () => void;
export type BackgroundAction = () => void;
export type StepText = string | RegExp;
export type RawStepAction = (...args: unknown[]) => unknown | Promise<unknown>;
export type HookArguments = [App];
export type HookAction = (...args: HookArguments) => unknown | Promise<unknown>;

export type StepArguments = [...unknown[], App] | [App];

export interface Types {
  [key: string]: unknown;
  text: string;
  word: string;
  string: string;
  number: number;
  float: number;
  int: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any: any;
  unknown: unknown;
  boolean: boolean;
  date: Date;
  primitive: string | number | boolean | Date;
}

export type CucumberExpressionArgs<
  TText extends string,
  TAccumulator extends unknown[] = []
> = TText extends `${infer _prefix}{${infer TArg}}${infer TRemainder}`
  ? TArg extends keyof Types
    ? CucumberExpressionArgs<TRemainder, [...TAccumulator, Types[TArg]]>
    : "unknown expression"
  : TAccumulator;

// export type StepArgs<TText extends string, TTable> = TTable extends
//   | NeverDataTable
//   | undefined
//   ? [...CucumberExpressionArgs<TText>, App]
//   : TTable extends TableDocument<DataTable>
//   ? [...CucumberExpressionArgs<TText>, TableDocument<any>[], App]
//   : TTable extends DataTable
//   ? [...CucumberExpressionArgs<TText>, TTable, App]
//   : [...CucumberExpressionArgs<TText>, App];
// // ? [...CucumberExpressionArgs<TText>, [TableD], App]
// // : [...CucumberExpressionArgs<TText>, TTable, App];

export type StepArgs<
  TText extends string,
  TTable extends DataTable | TableDocument<DataTable> | undefined
> = TTable extends TableDocument<DataTable>
  ? [...CucumberExpressionArgs<TText>, TTable[], App]
  : TTable extends NeverDataTable | undefined
  ? [...CucumberExpressionArgs<TText>, App]
  : TTable extends DataTable
  ? [...CucumberExpressionArgs<TText>, TTable, App]
  : [...CucumberExpressionArgs<TText>, App];

export type StepActionFn<
  TText extends string,
  TTable extends DataTable | TableDocument<DataTable> | undefined
> = (...args: StepArgs<TText, TTable>) => unknown | Promise<unknown>;

export type TimedScope = {
  readonly timeout: Timeout | undefined;
};

export type TimeoutUnit = "ms" | "s" | "m" | "h";
export type SizedTimeout = [number, TimeoutUnit];
export type TestTimeout = number | SizedTimeout;
