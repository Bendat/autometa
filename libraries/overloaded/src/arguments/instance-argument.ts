import { object } from "myzod";
import { Class } from "@autometa/types";
import { ShapeArgument } from "./shape-argument";
import { BaseArgument } from "./base-argument";
export const InstanceConstructorArgumentSchema = object({});

export class InstanceArgument<
  TClass extends { constructor: unknown },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TShape extends ShapeArgument<any, Partial<TClass>>
> extends BaseArgument<TClass> {
  typeName = "object";
  blueprint: Class<TClass>;
  shape: TShape;
  constructor(args: (string | Class<TClass> | TShape)[]) {
    super();
    if (typeof args[0] === "string") {
      this.argName = args[0];
    }

    if (typeof args[0] === "function") {
      this.blueprint = args[0];
    }

    if (typeof args[1] === "function") {
      this.blueprint === args[1];
    }
    if (typeof args[1] === "object") {
      this.shape = args[1];
    }
    if (typeof args[2] === "object") {
      this.shape = args[2];
    }
  }
  isTypeMatch(type: unknown): boolean {
    return type instanceof this.blueprint;
  }

  assertIsInstance(value: unknown) {
    if (this.blueprint && !(value instanceof this.blueprint)) {
      const message = `Expected value of ${value} to be an instance of ${this.blueprint.name} but it was not.`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertShapeArguments(value: unknown) {
    if (!this.shape) {
      return;
    }
    if (!value || !this.blueprint || !(value instanceof this.blueprint)) {
      return;
    }
    this.shape.validate(value);
    if (this.shape.accumulator.length > 0) {
      this.accumulator.push(this.shape.accumulator);
    }
  }
  validate(value: unknown): boolean {
    this.assertDefined(value);
    this.assertIsInstance(value);
    this.assertShapeArguments(value);
    return this.accumulator.length === 0;
  }
}

export function instance<
  TClass extends { constructor: unknown },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TShape extends ShapeArgument<any, Partial<TClass>>
>(blueprint: Class<TClass>, shape?: TShape): InstanceArgument<TClass, TShape>;
export function instance<
  TClass extends { constructor: unknown },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TShape extends ShapeArgument<any, Partial<TClass>>
>(
  name: string,
  blueprint: Class<TClass>,
  shape?: TShape
): InstanceArgument<TClass, TShape>;
export function instance<
  TClass extends { constructor: unknown },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TShape extends ShapeArgument<any, Partial<TClass>>
>(...args: (string | Class<TClass> | TShape)[]) {
  return new InstanceArgument<TClass, TShape>(args);
}
