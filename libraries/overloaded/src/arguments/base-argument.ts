import { object, boolean, Infer } from "myzod";
import { Accumulator } from "./accumulator";
import { ArgumentType } from "./types";
export const BaseArgumentSchema = object({
  optional: boolean()
    .or(
      object({
        undefined: boolean().optional(),
        null: boolean().optional(),
      })
    )
    .optional(),
});
export type BaseArgumentConfig = Infer<typeof BaseArgumentSchema>;

export abstract class BaseArgument<TType> {
  example?: TType;
  abstract typeName: string;
  protected _accumulator: Accumulator<string> = new Accumulator();
  readonly options?: BaseArgumentConfig;
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
  abstract isTypeMatch(type: unknown): boolean;

  assertDefined(
    value?: unknown,
    optional = this.options?.optional
  ): asserts value {
    if (optional === true) {
      return;
    }
    if (optional && optional.null == true && value === null) {
      return;
    }
    if (optional && optional.undefined == true && value === undefined) {
      return;
    }
    if (value === undefined || value === null) {
      const message = `Expected ${this.typeName} to be defined but found ${value}`;
      this.accumulator.push(this.fmt(message));
    }
  }

  protected shouldAssert(value: unknown, optional = this.options?.optional) {
    if (optional === true) {
      return true;
    }
    if (optional && optional.null === true && value == null) {
      return true;
    }
    if (optional && optional.undefined == true && value == undefined) {
      return true;
    }
    return false;
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
