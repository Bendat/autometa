import { Infer, object, string, tuple, boolean as bool } from "myzod";
import { BaseArgument } from "./base-argument";

export const BooleaValidationSchema = object({
  equals: bool().optional(),
});
const NumberArgumentConstructorSchema = tuple([
  string(),
  BooleaValidationSchema,
])
  .or(tuple([string().or(BooleaValidationSchema).optional()]))
  .or(tuple([]));

export type BooleanValidatorOpts = Infer<typeof BooleaValidationSchema>;

export class BooleanArgument<T extends boolean = boolean> extends BaseArgument<T> {
  typeName = "boolean";
  options?: BooleanValidatorOpts | undefined;
  argName?: string | undefined;
  constructor(
    args?:
      | [string | BooleanValidatorOpts | undefined]
      | [
          string | BooleanValidatorOpts | undefined,
          string | BooleanValidatorOpts | undefined
        ]
  ) {
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

  assertBoolean(val?: boolean): asserts val {
    if (typeof val !== "boolean") {
      this.accumulator.push(
        `Arg[${
          this.identifier
        }]: Expected boolean but found [type: ${typeof val}]${val}`
      );
    }
  }
  assertEquals(actual: boolean) {
    const equals = this.options?.equals;
    if (equals && actual !== this.options?.equals) {
      this.accumulator.push(
        `Arg[${this.identifier}]:Expected ${actual} to equal ${boolean} but did not.`
      );
    }
  }

  validate(value: boolean): boolean {
    this.assertDefined(value);
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
  const [nameOrOpts, opts] = args;
  NumberArgumentConstructorSchema.parse(args);
  return new BooleanArgument([nameOrOpts, opts]);
}
