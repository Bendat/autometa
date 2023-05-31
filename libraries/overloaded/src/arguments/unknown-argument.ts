import {
  BaseArgument,
  ArgumentOptions,
  BaseArgumentSchema,
} from "./base-argument";
import { array, string } from "myzod";
const UnknownArgumentParamsSchema = array(
  string().or(BaseArgumentSchema).optional()
).max(2);
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export class UnknownArgument<T extends unknown> extends BaseArgument<T> {
  typeName = "unknown";
  options?: ArgumentOptions = { optional: true };
  constructor(args: (string | ArgumentOptions)[]) {
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
  isTypeMatch(_type: unknown): boolean {
    throw true;
  }
  validate(_value: number): boolean {
    return this.accumulator.length === 0;
  }
}

export function unknown(): UnknownArgument<unknown>;
export function unknown(
  name: string,
  opts: ArgumentOptions
): UnknownArgument<unknown>;
export function unknown(opts: ArgumentOptions): UnknownArgument<unknown>;
export function unknown(
  ...args: (string | ArgumentOptions)[]
): UnknownArgument<unknown> {
  UnknownArgumentParamsSchema.parse(args);
  return new UnknownArgument(args);
}
