import { object, boolean, Infer, unknown } from "myzod";
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
  test: unknown().optional(),
});

export type ArgTestFunction<TArgType> = {
  test?: (arg: TArgType) => boolean;
};
export type ArgumentOptions = Infer<typeof BaseArgumentSchema>;
// &  ArgTestFunction<TArgType>;
export abstract class BaseArgument<TType> {
  example?: TType;
  abstract typeName: string;
  protected _accumulator: Accumulator<string> = new Accumulator();
  readonly options?: ArgumentOptions;
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

  baseAssertions(value?: unknown): asserts value {
    this.assertIsDefined(value);
    this.assertTestSucceeds(value);
  }
  assertIsDefined(value: unknown, optional = this.options?.optional) {
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
  assertTestSucceeds(value: unknown, test = this.options?.test) {
    if (value === undefined || value === null) {
      return;
    }
    const realTest = test as undefined | ((arg: unknown) => boolean);
    if (realTest) {
      const result = realTest(value);
      if (result === true) {
        return;
      }
      const message = `Expected ${value} to to evaluate to true but was ${result}.`;
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
