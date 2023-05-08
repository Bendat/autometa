import c from "chalk";
import { object, boolean, Infer } from "myzod";
import { Accumulator } from "./accumulator";
import { ArgumentType } from "./types";
export const BaseArgumentSchema = object({
  optional: boolean().or(
    object({
      undefined: boolean().optional(),
      null: boolean().optional(),
    })
  ),
});
export type BaseArgumentConfig = Infer<typeof BaseArgumentSchema>;

export abstract class BaseArgument<TType> {
  example?: TType;
  abstract typeName: string;
  protected _accumulator: Accumulator<string> = new Accumulator();
  readonly options?: unknown;
  argName?: string;
  argCategory = "Arg";
  #index: number;
  get accumulator() {
    return this._accumulator;
  }
  get index() {
    return this.#index;
  }
  get identifier() {
    return this.argName ?? this.index ?? "unnamed arg";
  }

  withIndex(index: number) {
    this.#index = index;
    return this;
  }

  assertDefined(value?: unknown): asserts value {
    if (value === undefined || value === null) {
      const message = `Expected ${c.gray(
        c.italic(this.typeName)
      )} to be defined but found ${c.red(value)}`;
      this.accumulator.push(this.fmt(message));
    }
  }

  abstract validate(
    value: unknown,
    parent?: BaseArgument<ArgumentType>
  ): boolean;
  protected fmt(message: string, padDepth = 0) {
    const pad = " ".repeat(padDepth);
    return `${pad}${this.argCategory}[${this.identifier}]: ${message}`;
  }
}
