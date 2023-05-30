import { Infer, object } from "myzod";
import { Class, AbstractClass } from "@autometa/types";
import { ShapeArgument } from "./shape-argument";
import { BaseArgument, BaseArgumentSchema } from "./base-argument";
export const InstanceConstructorArgumentSchema = object({});
export const InstanceOptionsArgumentSchema = object({}).and(BaseArgumentSchema);
export type InstanceOptions = Infer<typeof InstanceOptionsArgumentSchema>;
export class InstanceArgument<
  TClass extends { constructor: unknown },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TShape extends ShapeArgument<any, Partial<TClass>>
> extends BaseArgument<TClass> {
  typeName = "object";
  blueprint: Class<TClass>;
  declare options?: InstanceOptions;
  shape: TShape;
  constructor(args: (string | Class<TClass> | TShape)[]) {
    super();
    if (typeof args[0] === "string") {
      this.argName = args.shift() as string;
    }

    if (typeof args[0] === "function") {
      this.blueprint = args.shift() as Class<TClass>;
    }

    if (typeof args[0] === "object") {
      this.shape = args.shift() as TShape;
    }
    if (typeof args[0] === "undefined") {
      args.shift();
    }
    if (typeof args[0] === "object") {
      this.options = args.shift() as InstanceOptions;
    }
  }
  isTypeMatch(type: unknown): boolean {
    return type instanceof this.blueprint;
  }

  assertIsInstance(value: unknown) {
    if (
      value !== undefined &&
      this.blueprint &&
      !(value instanceof this.blueprint)
    ) {
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
    this.baseAssertions(value);
    this.assertIsInstance(value);
    this.assertShapeArguments(value);
    return this.accumulator.length === 0;
  }
}

export function instance<
  TClass extends { constructor: unknown },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TShape extends ShapeArgument<any, Partial<TClass>>
>(
  blueprint: Class<TClass> | AbstractClass<TClass>,
  shape?: TShape | null,
  options?: InstanceOptions
): InstanceArgument<TClass, TShape>;
export function instance<
  TClass extends { constructor: unknown },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TShape extends ShapeArgument<any, Partial<TClass>>
>(
  name: string,
  blueprint: Class<TClass> | AbstractClass<TClass>,
  shape?: TShape | null,
  options?: InstanceOptions
): InstanceArgument<TClass, TShape>;
export function instance<
  TClass extends { constructor: unknown },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TShape extends ShapeArgument<any, Partial<TClass>>
>(...args: (string | Class<TClass> | TShape)[]) {
  return new InstanceArgument<TClass, TShape>(args);
}
