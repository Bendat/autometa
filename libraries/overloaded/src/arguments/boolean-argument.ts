import { Infer, object, string, boolean as bool, array } from "myzod";
import { BaseArgument, BaseArgumentSchema } from "./base-argument";

export const BooleaValidationSchema = object({
  equals: bool().optional(),
  // "not" equals property
}).and(BaseArgumentSchema);

const BooleanArgumentConstructorSchema = array(
  string().or(BooleaValidationSchema)
);

export type BooleanValidatorOpts = Infer<typeof BooleaValidationSchema>;

export class BooleanArgument<
  T extends boolean = boolean
> extends BaseArgument<T> {
  typeName = "boolean";
  declare options?: BooleanValidatorOpts;

  constructor(args: (BooleanValidatorOpts | string)[]) {
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

  assertBoolean(actual?: boolean): asserts actual {
    if (actual === undefined) {
      return;
    }
    if (actual !== undefined && typeof actual !== "boolean") {
      this.accumulator.push(
        `Arg[${
          this.identifier
        }]: Expected boolean but found [type: ${typeof actual}]${actual}`
      );
    }
  }
  assertEquals(actual: boolean) {
    if (actual === undefined) {
      return;
    }
    const equals = this.options?.equals;
    if (actual !== undefined && equals !== undefined && actual !== equals) {
      this.accumulator.push(
        `Arg[${this.identifier}]:Expected ${actual} to equal ${boolean} but did not.`
      );
    }
  }
  isTypeMatch(type: unknown): boolean {
    return typeof type === this.typeName;
  }

  validate(value: boolean): boolean {
    this.baseAssertions(value);
    this.assertBoolean(value);
    this.assertEquals(value);
    return this.accumulator.length === 0;
  }
}

export function boolean(): BooleanArgument<boolean>;
export function boolean(opts: BooleanValidatorOpts): BooleanArgument<boolean>;
export function boolean(name: string): BooleanArgument<boolean>;
export function boolean(
  name: string,
  opts: BooleanValidatorOpts
): BaseArgument<boolean>;
export function boolean(
  ...args: (BooleanValidatorOpts | string)[]
): BooleanArgument {
  BooleanArgumentConstructorSchema.parse(args);
  return new BooleanArgument(args);
}
