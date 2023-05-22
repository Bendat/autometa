import { BaseArgument, BaseArgumentConfig } from "./base-argument";
import { string } from "myzod";
const UnknownArgumentParamsSchema = string();
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export class UnknownArgument<T extends unknown> extends BaseArgument<T> {
  typeName = "unknown";
  options?: BaseArgumentConfig = { optional: true };
  argName?: string | undefined;
  constructor(readonly name?: string) {
    super();
  }
  isTypeMatch(_type: unknown): boolean {
    throw true;
  }
  validate(_value: number): boolean {
    return this.accumulator.length === 0;
  }
}

export function unknown(): UnknownArgument<unknown>;
export function unknown(name: string): UnknownArgument<unknown>;
export function unknown(name?: string): UnknownArgument<unknown> {
  UnknownArgumentParamsSchema.parse(name);
  return new UnknownArgument(name);
}
