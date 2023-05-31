import gitDiff from "git-diff";
import { Infer, array, string as zstring, object, number, tuple } from "myzod";
import { BaseArgument, BaseArgumentSchema } from "./base-argument";
export const StringValidatorOpsSchema = object({
  minLength: number().optional(),
  maxLength: number().optional(),
  includes: zstring().optional(),
  equals: zstring().optional(),
  in: array(zstring()).optional(),
  startsWith: zstring().optional(),
  endsWith: zstring().optional(),
  pattern: object({ source: zstring() }, { allowUnknown: true }).optional(),
}).and(BaseArgumentSchema);

export type StringValidatorOpts = Infer<typeof StringValidatorOpsSchema> & {
  pattern?: RegExp;
  test?: (arg: string) => boolean;
};

const StringArgumentConstructorSchema = tuple([
  zstring(),
  StringValidatorOpsSchema,
])
  .or(tuple([zstring().or(StringValidatorOpsSchema)]))
  .or(tuple([]));

export class StringArgument<T extends string> extends BaseArgument<T> {
  typeName = "string";
  declare options?: StringValidatorOpts;

  constructor(args?: (string | StringValidatorOpts)[]) {
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
    return type === this.typeName || typeof type === this.typeName;
  }
  assertStringLessThanMax(str: string, max = this.options?.maxLength) {
    if (
      typeof max === "number" &&
      typeof str === "string" &&
      str.length > max
    ) {
      const message = `Expected ${str} to have less than ${max} characters but found ${str.length}`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertStringGreaterThanMin(str: unknown, min = this.options?.minLength) {
    if (
      typeof min === "number" &&
      typeof str === "string" &&
      str.length < min
    ) {
      const message = `Expected ${str} to have at least ${min} characters but found ${str.length}`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertStringIncludes(str: unknown, value = this.options?.includes) {
    if (
      typeof str === "string" &&
      typeof value === "string" &&
      !str.includes(value)
    ) {
      const message = `Expected ${str} to include ${value} but the substring could not be found`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertStringIn(str: unknown, value = this.options?.in) {
    if (
      typeof str === "string" &&
      Array.isArray(value) &&
      !value.includes(str)
    ) {
      const message = `Expected ${str} to be a member of list ${JSON.stringify(
        value
      )} but the substring could not be found`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertStringEquals(str: unknown, value = this.options?.equals) {
    if (typeof str === "string" && typeof value === "string" && str !== value) {
      const diff = gitDiff(str, value);
      const message = `Expected ${str} to equal ${value} but did not. Diff: \n${diff}`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertStringMatches(str: unknown, pattern = this.options?.pattern) {
    if (
      typeof str === "string" &&
      pattern instanceof RegExp &&
      pattern.test(str)
    ) {
      const message = `Expected ${pattern} to match pattern ${pattern.source} but it did not`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertString(str?: unknown) {
    if (typeof str !== "string" && !this.options?.optional) {
      const message = `Expected argument to be of type 'string' but was: [${typeof str}] ${str}`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertinArray(str: unknown, array = this.options?.in) {
    if (
      typeof str === "string" &&
      Array.isArray(array) &&
      !array.includes(str)
    ) {
      const message = `Expected ${array} to include ${str} but it was not`;
      this.accumulator.push(this.fmt(message));
    }
  }

  validate(value: string) {
    this.baseAssertions(value);
    this.assertString(value);
    this.assertStringEquals(value);
    this.assertStringLessThanMax(value);
    this.assertStringGreaterThanMin(value);
    this.assertinArray(value);
    this.assertStringIncludes(value);
    return this.accumulator.length === 0;
  }
}

export function string(): StringArgument<string>;
export function string(opts: StringValidatorOpts): StringArgument<string>;
export function string(name: string): StringArgument<string>;
export function string(
  name: string,
  opts: StringValidatorOpts
): BaseArgument<string>;
export function string(
  ...args: (StringValidatorOpts | string)[]
): StringArgument<string> {
  StringArgumentConstructorSchema.parse(args);
  return new StringArgument(args);
}
