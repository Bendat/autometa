import { BaseArgument } from "./base-argument";
import chalk from "chalk";
import { Infer, string, object, boolean, tuple } from "myzod";
import { FromShape, ShapeType } from "./types";

export const ShapeValidationSchema = object({
  exhaustive: boolean(),
});
const ShapeArgumentConstructorSchema = tuple([string(), ShapeValidationSchema])
  .or(tuple([string().or(ShapeValidationSchema).optional()]))
  .or(tuple([]));

export type ShapeOptions = Infer<typeof ShapeValidationSchema>;
export type ShapeValidatorOpts = Infer<typeof ShapeValidationSchema>;

export class ShapeArgument<
  T extends ShapeType,
  TRaw extends FromShape<T>
> extends BaseArgument<TRaw> {
  typeName = "object";
  options?: ShapeOptions;
  constructor(readonly reference: T) {
    super();
    for (const key in reference) {
      const name = reference[key].argName;
      if (!name) {
        reference[key].argName = key;
        reference[key].argCategory = "Property";
      }
    }
  }

  assertObject(value: TRaw) {
    if (typeof value !== "object") {
      const message = `Expected value to be an ${chalk.blue(
        this.typeName
      )} but was [${typeof value}]: ${value}`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertExhaustive(value: TRaw) {
    if (!this.options?.exhaustive || !(this.options?.exhaustive === true)) {
      return;
    }
    const keys = Object.keys(this.reference);
    const hasKeys = !keys.map((key) => key in value).includes(false);
    if (!hasKeys) {
      const filter = keys
        .filter((key) => !(key in value))
        .map((key) => ` ${key}: ${this.reference[key].typeName} `)
        .join(", ");
      const message = `Expected object to include all defined keys, but was missing {${filter}}`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertShapeMatches(value: Record<string, unknown> | undefined | null) {
    const refShape: ShapeType = this.reference;
    for (const key in refShape) {
      const reference = refShape[key];
      const actual = value && value[key];
      if (!reference.validate(actual)) {
        const message = `Expected all properties to be valid but found:`;
        this.accumulator.push(this.fmt(message));
        if (reference.accumulator.length > 0) {
          this.accumulator.push(reference.accumulator);
        }
      }
    }
  }

  validate(value: TRaw): boolean {
    this.assertDefined(value);
    this.assertObject(value);
    this.assertExhaustive(value);
    this.assertShapeMatches(value);
    return this._accumulator.length === 0;
  }
}

export function shape<T extends ShapeType>(reference: T) {
  return new ShapeArgument(reference);
}
