import c from "chalk";
import { AnyArg } from "src/types";
export type Primitive = string | number | boolean | undefined | null;
export type Shape = { [key: string]: ArgumentType };
export type Array = { [key: number]: ArgumentType };
export type ShapeType = { [key: string]: AnyArg };
export type FromShape<T> = T extends {
  [K in keyof T]: T[K] extends AnyArg ? T[K] : never;
}
  ? {
      [K in keyof T]: T[K] extends BaseArgument<infer TArg> ? TArg : never;
    }
  : never;

export type ArgumentType = Shape | Array | Primitive;

export class Accumulator<T> extends Array<T | Accumulator<T>> {
  asString(depth = 0) {
    let str = "";
    for (const value of this) {
      if (typeof value === "string") {
        str += "   ".repeat(depth) + value + "\n";
      }
      if (value instanceof Accumulator) {
        str += value.asString(depth + 1) + "\n";
      }
    }
    return str;
  }
}
export abstract class BaseArgument<TType> {
  example?: TType;
  abstract typeName: string;
  protected _accumulator: Accumulator<string> = new Accumulator();
  abstract readonly options?: unknown;
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
