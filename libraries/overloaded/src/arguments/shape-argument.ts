import { BaseArgument, BaseArgumentSchema } from "./base-argument";
import { Infer, string, object, boolean, array } from "myzod";
import { FromShape, ShapeType } from "./types";

export const ShapeValidationSchema = object({
  exhaustive: boolean().optional(),
  instance: object({}, { allowUnknown: true }).optional(),
}).and(BaseArgumentSchema);

export type ShapeOptions = Infer<typeof ShapeValidationSchema>;
export type ShapeValidatorOpts = Infer<typeof ShapeValidationSchema>;

export class ShapeArgument<
  T extends ShapeType,
  TRaw extends FromShape<T>
> extends BaseArgument<TRaw> {
  typeName = "object";
  declare options?: ShapeOptions;
  reference: T;
  constructor(args: (string | T | ShapeOptions)[]) {
    super();
    if (typeof args[0] === "string") {
      this.argName = args[0];
    }
    if (typeof args[0] === "object") {
      this.reference = args[0] as unknown as T;
      if (typeof args[1] === "object") {
        this.options = args[1] as unknown as ShapeOptions;
      }
    } else if (typeof args[1] === "object") {
      this.reference = args[1] as unknown as T;
      if (typeof args[2] === "object") {
        this.options = args[2] as unknown as ShapeOptions;
      }
    }
    if (!this.reference) {
      throw new Error(`Shape Argument must be provided a reference object`);
    }
    for (const key in this.reference) {
      const name = this.reference[key].argName;
      if (!name) {
        this.reference[key].argName = key;
        this.reference[key].argCategory = "Property";
      }
    }
  }
  isTypeMatch(type: unknown): boolean {
    return type === this.typeName || typeof type === this.typeName;
  }
  assertObject(value: unknown) {
    if (typeof value !== "object") {
      const message = `Expected value to be an ${
        this.typeName
      } but was [type: ${typeof value}]: '${value}'`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertExhaustive(value: unknown) {
    if (
      this.options?.exhaustive === undefined ||
      this.options?.exhaustive === false
    ) {
      return;
    }
    const asObj = value as unknown as Record<string, unknown>;
    const refKeys = Object.keys(this.reference);
    const valKeys = Object.keys(asObj);
    if (refKeys.length != valKeys.length) {
      for (const property of valKeys) {
        if (!(property in this.reference)) {
          const message = `Argument value contains property '${property}' which is not known for object with keys [${refKeys
            .map((it) => `'${it}'`)
            .join()}]`;
          this.accumulator.push(this.fmt(message));
        }
      }
    }
  }

  assertShapeMatches(value: unknown | undefined | null) {
    const refShape: ShapeType = this.reference;
    const asObj = value as unknown as Record<string, unknown>;
    for (const key in refShape) {
      const reference = refShape[key];
      const actual = value && asObj[key];
      if (!reference.validate(actual)) {
        const message = `Expected all properties to be valid but found:`;
        this.accumulator.push(this.fmt(message));
        if (reference.accumulator.length > 0) {
          this.accumulator.push(reference.accumulator);
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assertIsInstance(value: unknown, instance: any = this.options?.instance) {
    if (instance && !(value instanceof instance)) {
      const message = `Expected shape to be an instance of ${instance} but was not`;
      this.accumulator.push(this.fmt(message));
    }
  }

  validate(value: unknown): boolean {
    this.assertDefined(value);
    this.assertObject(value);
    this.assertExhaustive(value);
    this.assertShapeMatches(value);
    this.assertIsInstance(value);
    return this._accumulator.length === 0;
  }
}
const ShapeArgumentParamsSchema = array(
  string()
    .or(object({}).allowUnknownKeys())
    .or(ShapeValidationSchema)
    .optional()
);
export function shape<T extends ShapeType>(
  reference: T
): ShapeArgument<T, FromShape<T>>;
export function shape<T extends ShapeType>(
  name: string,
  reference: T
): ShapeArgument<T, FromShape<T>>;
export function shape<T extends ShapeType>(
  name: string,
  reference: T,
  options?: ShapeOptions
): ShapeArgument<T, FromShape<T>>;
export function shape<T extends ShapeType>(
  reference: T,
  options?: ShapeOptions
): ShapeArgument<T, FromShape<T>>;
export function shape<T extends ShapeType>(
  ...args: (string | T | ShapeOptions)[]
) {
  ShapeArgumentParamsSchema.parse(args);
  return new ShapeArgument(args);
}
