import { date as dt, Infer, object, string, array } from "myzod";
import { BaseArgument, BaseArgumentSchema } from "./base-argument";

export const DateValidationOptsSchema = object({
  before: dt().optional(),
  after: dt().optional(),
  equals: dt().optional(),
}).and(BaseArgumentSchema);

export type DateValidatorOpts = Infer<typeof DateValidationOptsSchema>;

const DateConstructorArgumentSchema = array(
  string().or(DateValidationOptsSchema.optional())
);

export type DateArguments = Infer<typeof DateConstructorArgumentSchema>;

export class DateArgument<T extends Date> extends BaseArgument<T> {
  typeName = "Date";
  isTypeMatch(type: unknown): boolean {
    return type instanceof DateArgument;
  }
  declare options?: DateValidatorOpts;

  constructor(args: DateArguments) {
    super();
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

  assertBefore(value: unknown, before = this.options?.before) {
    if (!before || !(value instanceof Date)) {
      return;
    }
    if (value >= before) {
      const message = `Expected date '${value}' to be earlier than '${before}'`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertAfter(value: unknown, after = this.options?.after) {
    if (!after || !(value instanceof Date)) {
      return;
    }
    if (value <= after) {
      const message = `Expected date '${value}' to be later than '${after}'`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertEquals(value: unknown, equals = this.options?.equals) {
    if (!equals || !(value instanceof Date)) {
      return;
    }
    if (value !== equals) {
      const message = `Expected date '${value}' to be equal to '${equals}'`;
      this.accumulator.push(this.fmt(message));
    }
  }

  validate(value: unknown): boolean {
    this.assertDefined(value);
    this.assertBefore(value);
    this.assertAfter(value);
    this.assertEquals(value);
    return this.accumulator.length === 0;
  }
}

export function date(): DateArgument<Date>;
export function date(name: string): DateArgument<Date>;
export function date(
  name: string,
  options: DateValidatorOpts
): DateArgument<Date>;
export function date(options: DateValidatorOpts): DateArgument<Date>;
export function date(...args: DateArguments): DateArgument<Date> {
  return new DateArgument(args);
}
