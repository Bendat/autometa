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
    // https://i.imgflip.com/5my6xa.jpg
    // todo: what the hell is this
    if (value === undefined || value === null) {
      return;
    }
    const realTest = test as undefined | ((arg: unknown) => boolean);
    if (realTest) {
      const result = realTest(value);
      if (result === true) {
        return;
      }
      const message = `Expected ${value} to evaluate to true but was ${result}.`;
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
  or<K>(second: BaseArgument<K>): BaseArgument<TType | K> {
    return or(this, second);
  }
}

export class UnionArgument<T, K> extends BaseArgument<T | K> {
  get typeName() {
    return this.first ? this.first.typeName : this.second.typeName;
  }

  constructor(
    readonly first: BaseArgument<T>,
    readonly second: BaseArgument<K>
  ) {
    super();
  }
  assertUnion(actual: T | K) {
    if (!this.first.isTypeMatch(actual) && !this.second.isTypeMatch(actual)) {
      this.accumulator.push(
        `Arg[${this.identifier}]:Expected ${actual} to be one of ${this.first.typeName} or ${this.second.typeName}.`
      );
    }
  }

  isTypeMatch(type: unknown): boolean {
    return typeof type === this.typeName;
  }

  validate(value: T | K): boolean {
    this.assertUnion(value);
    if (this.first) {
      this.first.validate(value);
    }
    if (this.second && !this.first) {
      this.second.validate(value);
    }
    return this.accumulator.length === 0;
  }
}

export function or<T, K>(
  first: BaseArgument<T>,
  second: BaseArgument<K>
): BaseArgument<T | K> {
  return new UnionArgument(first, second);
}
