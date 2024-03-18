import z, { Infer, string as zstring, object, tuple } from "myzod";
import { BaseArgument, BaseArgumentSchema } from "./base-argument";
export const NilValidatorOpsSchema = object({
  equals: z.literal("null").or(z.literal("undefined")).optional(),
}).and(BaseArgumentSchema);

export type NilValidatorOpts = Infer<typeof NilValidatorOpsSchema> & {
  pattern?: RegExp;
};

const NilArgumentConstructorSchema = tuple([zstring(), NilValidatorOpsSchema])
  .or(tuple([zstring().or(NilValidatorOpsSchema)]))
  .or(tuple([]));

export class NilArgument<T extends null | undefined> extends BaseArgument<T> {
  typeName = "undefined";
  declare options?: NilValidatorOpts;

  constructor(args?: (string | NilValidatorOpts)[]) {
    super();
    if (!args) {
      return;
    }
    if (typeof args[0] === "string") {
      this.argName = args[0];
    }
    if (typeof args[0] === "object") {
      this.options = args[0];
    }
    if (typeof args[1] === "object") {
      this.options = args[1];
    }
  }
  isTypeMatch(type: unknown): boolean {
    return type === null || type === undefined;
  }
  assertIsNullOrUndefined(value: unknown) {
    if (value == null && value !== undefined) {
      const msg = `Expected ${this.typeName} to be null or undefined but found ${value}`;
      this.accumulator.push(this.fmt(msg));
    }
  }
  assertIsNull(value: unknown) {
    if (
      (this.options?.equals === "undefined" || !this.options?.equals) &&
      value === undefined
    ) {
      return;
    }
    if (value !== null) {
      const msg = `Expected ${this.typeName} to be null but found ${value}`;
      this.accumulator.push(this.fmt(msg));
    }
  }

  assertIsUndefined(value: unknown) {
    if (this.options?.equals === "null" && value === null) {
      return;
    }
    if (value !== undefined) {
      const msg = `Expected ${this.typeName} to be undefined but found ${value}`;
      this.accumulator.push(this.fmt(msg));
    }
  }
  validate(value: string) {
    this.assertIsUndefined(value);
    this.assertIsNull(value);
    return this.accumulator.length === 0;
  }
}

export function nil(): NilArgument<null | undefined>;
export function nil(opts: NilValidatorOpts): NilArgument<null | undefined>;
export function nil(name: string): NilArgument<null | undefined>;
export function nil(
  name: string,
  opts: NilValidatorOpts
): BaseArgument<null | undefined>;
export function nil(
  ...args: (NilValidatorOpts | string)[]
): NilArgument<null | undefined> {
  NilArgumentConstructorSchema.parse(args);
  return new NilArgument(args);
}
