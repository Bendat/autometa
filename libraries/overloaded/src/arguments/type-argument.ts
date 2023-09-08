import { BaseArgument } from "./base-argument";
import { AbstractClass, Class } from "./types";

export class TypeArgument<
  T extends Class<unknown> | AbstractClass<unknown>
> extends BaseArgument<T> {
  typeName = "function";
  types: string[] = [];
  readonly name?: string;
  readonly type: T;
  constructor(strOrT: string | T, type?: T) {
    super();
    if (strOrT === "string") {
      this.name = strOrT;
      this.type = type as T;
    }
    if (typeof strOrT === "function") {
      this.type = strOrT;
    }
    if (typeof type === "function") {
      this.type = type;
    }
  }

  isTypeMatch(type: unknown): boolean {
    return type === this.typeName || typeof type === this.typeName;
  }

  assertType(value: unknown, match = this.type) {
    if (value === match) {
      return;
    }
    this.accumulator.push(
      this.fmt(
        `Expected value of ${value} to be of type ${match.name} but it was not.`
      )
    );
  }

  validate(value: unknown): boolean {
    this.assertIsDefined(value);
    this.baseAssertions(value);
    this.assertType(value);
    return this.accumulator.length === 0;
  }
}

export function type<T extends Class<unknown> | AbstractClass<unknown>>(
  type: T
): TypeArgument<T>;
export function type<T extends Class<unknown> | AbstractClass<unknown>>(
  name: string,
  type: Class<T>
): TypeArgument<T>;
export function type<T extends Class<unknown> | AbstractClass<unknown>>(
  nameOrType: string | T,
  type?: T
) {
  return new TypeArgument(nameOrType, type);
}
