import gitDiff from "git-diff";
import { Infer, array, string as zstring, object, number, tuple } from "myzod";
import { BaseArgument } from "./base-argument";
export const StringValidatorOpsSchema = object({
  minLength: number().optional(),
  maxLength: number().optional(),
  includes: zstring().optional(),
  equals: zstring().optional(),
  in: array(zstring()).optional(),
  startsWith: zstring().optional(),
  endsWith: zstring().optional(),
});

export type StringValidatorOpts = Infer<typeof StringValidatorOpsSchema>;

const StringArgumentConstructorSchema = tuple([
  zstring(),
  StringValidatorOpsSchema,
])
  .or(tuple([zstring().or(StringValidatorOpsSchema)]))
  .or(tuple([]));

export class StringArgument<T extends string> extends BaseArgument<T> {
  typeName = "string";
  options?: StringValidatorOpts;
  argName?: string;
  constructor(
    args?:
      | [string | StringValidatorOpts | undefined]
      | [
          string | StringValidatorOpts | undefined,
          string | StringValidatorOpts | undefined
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

  assertStringLessThanMax(str: string, max?: number) {
    if (max && str.length > max) {
      const message = `Expected ${str} to have less than ${max} characters but found ${str.length}`;
      this.accumulator.push(this.fmt(message));
      return false;
    }
    return true;
  }

  assertStringGreaterThanMin(str: string, min?: number) {
    if (min && str.length < min) {
      const message = `Expected ${str} to have at least ${min} characters but found ${str.length}`;
      this.accumulator.push(this.fmt(message));
      return false;
    }
    return true;
  }
  assertStringIncludes(str: string, value?: string) {
    if (value && !str.includes(value)) {
      const message = `Expected ${str} to include ${value} but the substring could not be found`;
      this.accumulator.push(this.fmt(message));
      return false;
    }
    return true;
  }

  assertStringEquals(str: string, value?: string) {
    if (value && str !== value) {
      const diff = gitDiff(str, value);
      const message = `Expected ${str} to equal ${value} but did not. Diff: \n${diff}`;
      this.accumulator.push(this.fmt(message));
      return false;
    }
    return true;
  }

  assertStringIn(str: string, value?: string[]) {
    if (value && !value.includes(str)) {
      const message = `Expected ${value} to include ${str} but it was not`;
      this.accumulator.push(this.fmt(message));
      return false;
    }
    return true;
  }

  assertStringMatches(str: string, value?: RegExp) {
    if (value && value.test(str)) {
      const message = `Expected ${value} to match pattern ${value} but it did not`;
      this.accumulator.push(this.fmt(message));
      return false;
    }
    return true;
  }

  assertString(str?: string) {
    if (typeof str !== "string") {
      const message = `Expected argument to be of type 'string' but was: [${typeof str}] ${str}`;
      this.accumulator.push(this.fmt(message));
      return false;
    }
    return true;
  }

  validate(value: string) {
    this.assertDefined(value);
    this.assertString(value);
    this.assertStringEquals(value, this.options?.equals);
    this.assertStringLessThanMax(value, this.options?.maxLength);
    this.assertStringGreaterThanMin(value, this.options?.minLength);
    this.assertStringIn(value, this.options?.in);
    this.assertStringIncludes(value, this.options?.includes);
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
  const [nameOrOpts, opts] = args;
  StringArgumentConstructorSchema.parse(args);
  return new StringArgument([nameOrOpts, opts]);
}
