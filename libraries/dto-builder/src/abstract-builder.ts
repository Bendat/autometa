import { ValidationError } from "./validation-error";
import { FailedValidationError } from "./errors/validation-errors";
import { Dict } from "./types";
import { Class } from "@autometa/types";
import { closestMatch } from "closest-match";
export abstract class AbstractDtoBuilder<TDtoType> {
  #dto: TDtoType & { constructor: { name: string } };
  protected get dto() {
    return this.#dto;
  }
  /**
   * Creates a new AbstractBuilder.
   * @param prototype A class reference to the DTO
   * to be built. I.e for the class `class FooDTO`,
   * `FooDTO` is passed, not `new FooDTO`
   */
  constructor(prototype: Class<TDtoType>, instance?: TDtoType) {
    if (instance) {
      this.#dto = instance;
    } else {
      this.#dto = new prototype() as TDtoType & { constructor: { name: string } };
    }
  }

  /**
   * Finalized the builder, providing back the created
   * data. If the DTO has `class-validator` decorators,
   * then it will be validated.
   * @param builderConfig config for this build action,
   * such as whether to validate or not. If the property
   * `validate` is set to false, validation will not occur.
   *
   * @returns An object representing the data which
   * was added to this builder, validated by default.
   */

  build = (validate = false): TDtoType => {
    if (validate) {
      return AbstractDtoBuilder.validate(this.#dto);
    }
    return this.#dto;
  };
  static validate = <T extends { constructor: { name: string } }>(dto: T) => {
    const { validateSync } = classValidators();
    const validated = validateSync(dto as unknown as object);
    if (validated.length > 0) {
      const type = dto.constructor.name;
      const errorString = humaniseValidationErrors(type, validated);
      console.error(errorString);
      throw new FailedValidationError(validated.join("").trimEnd(), validated);
    }
    return dto;
  };
  /**
   * Proxy function for builder functions. Takes the name
   * of the property/field to update an provides
   * a function which can set that property in
   * the builders internal data structure.
   *
   * ```
   * class FooBuilder extends AbstractBuilder<SomeDTO>{
   *    foo = this.set('foo'); // foo is now a builder function
   * }
   *
   * const builder = new FooBuilder();
   * builder.foo('foo value');
   * ```
   * @param propertyName The name of the class property/field to update
   * when executed.
   * @returns A function which sets a property in this builders
   * internal data model
   */
  protected set = <TPropertyType>(propertyName: string) => {
    const dto = this.#dto as Dict;

    return (value: TPropertyType) => {
      dto[propertyName] = value;
      return this;
    };
  };

  assign = (property: string, value: unknown) => {
    this.set(property)(value);
    return this;
  };

  append = (property: string, value: unknown) => {
    if (property in this.#dto) {
      assertKey(this.#dto, property);
      const asArr = this.#dto[property] as unknown as unknown[];
      asArr.push(value);
    } else {
      this.set(property)([value]);
    }
    return this;
  };
}
export function assertKey<TObj>(item: TObj, key: string | keyof TObj): asserts key is keyof TObj {
  if (item === null || item === undefined) {
    throw new Error(`Item cannot be null or undefined if indexing for values`);
  }
  if (!(typeof item === "object" || typeof item === "function")) {
    throw new Error(`A key can only be valid for a value whos type is object: ${item}`);
  }
  if (key && typeof key == "string" && key in item) {
    return;
  }
  const matches = closestMatch(key as string, Object.keys(item), true) ?? [];
  const properties = Object.getOwnPropertyNames(item)
    .map((it) => it)
    .join(`,\n\t`);
  const objStr = `[ ${"World {"}\n\t${properties}\n   ${"}"}]`;
  throw new Error(
    `Key [${String(key)}] does not exist on target ${objStr}.
Did you mean: 
${Array.isArray(matches) ? matches.join("\n") : matches}`
  );
}
// Creates a person oriented (non JSON) string representing
// validation failures.
function humaniseValidationErrors(dtoName: string, errors: ValidationError[]) {
  const base = `An instance of ${dtoName} has failed validation:`;
  // convert each error into a string format
  const errorString = errors
    .map((error) => {
      const { property, value, constraints } = error;
      const safeConstraints = constraints ?? {};
      const constraintKeys = Object.keys(safeConstraints ?? {});
      const constraintMessages = constraintKeys
        .map((key) => `    - ${key}: ${safeConstraints[key]}`)
        .join("\n")
        .trimEnd();
      const message = `• Property \`${property}\` has failed the following constraints:
${constraintMessages}
    [ Actual Value: ${value} ]`;
      return message;
    })
    .join("\n")
    .trimEnd();
  return `${base}\n${errorString}`;
}

function classValidators() {
  try {
    require.resolve("class-validator");
    return require("class-validator");
  } catch {
    throw new Error(
      "class-validator is not installed. To use validation, please add class-validator as a dependency"
    );
  }
}
