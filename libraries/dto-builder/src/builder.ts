import { AbstractDtoBuilder } from "./abstract-builder";
import { getDtoDefaultsDecorators, getDtoPropertyDecorators, isDto } from "./dto-decorators";
import { Class, Dict } from "./types";

/*
 * Takes an object, iterates through it's keys, and produces
 * an identical interface but replacing the type of the property
 * with a function accepting the type of that property, and which returns
 * the DTOBuilder attached to this type.
 * I.e
 * ```
 * class SomeDTO {
 *  @SomeValidation()
 *  name: string = ''
 *  age: number = 0
 * }
 * ```
 * it produces an interface:
 * ```
 * interface SomeDtoBuilder{
 *  name: (name: string)=> SomeDtoBuilder;
 *  age: (age: number)=> SomeDtoBuilder;
 * }
 * ```
 */
type DtoBuilderTransformer<T> = {
  [P in keyof T]-?: (value: T[P]) => DtoBuilder<T>;
};
/**
 * Combines the abstract builder with a transformer
 * that appends the original properties of the type
 * as builder/setter functions.
 *
 * I.e if the original type has `foo: string`, the builder
 * will have `foo: (value: string): void` and `build(): T`
 *
 * Expects T to be a class.
 */
export type DtoBuilder<T> = AbstractDtoBuilder<T> & DtoBuilderTransformer<T>;

/**
 * Generates a new *DTOBuilder class which containers builder/setter
 * functions for each property/field in the source DTO.
 *
 * @param dtoType The Class blueprint of the DTO type to create a
 * builer for. I.E. for `class FooDTO`, `FooDTO` is passed, not `new fooDTO`
 *
 * @returns an instantiable class which mirrors the DTO type
 * but with builder/setter functions instead of properties/fields -
 * I.E. `foo: string` becomes `foo: (value: string) => DtoBuilder<T>`
 */
export function Builder<T>(dtoType: Class<T>): Class<DtoBuilder<T>> {
  // Generate a new class which will be the DTO
  const GeneratedBuilder = class GeneratedBuilder extends AbstractDtoBuilder<T> {
    constructor() {
      const dto = new dtoType() as T;
      super(dtoType, dto);
      const propertyNames = getDtoPropertyDecorators(dto as { constructor: { name: string } });
      const self = this as unknown as Dict;
      propertyNames.forEach((key) => {
        self[key] = (arg: T) => this.set(key)(arg);
      });
      const defaultValues = getDtoDefaultsDecorators(dto as { constructor: { name: string } });
      constructDefaults(dto, defaultValues);
    }
  };

  return GeneratedBuilder as Class<DtoBuilder<T>>;
}

function constructDefaults<T>(target: T, values: ReturnType<typeof getDtoDefaultsDecorators>) {
  values.forEach(({ propertyKey, defaultValue }) => {
    if (isDto(defaultValue as Record<string, unknown>)) {
      const instance = new (defaultValue as Class<unknown>)();
      constructDefaults(
        instance,
        getDtoDefaultsDecorators(instance as { constructor: { name: string } })
      );
      (target as Record<string, unknown>)[propertyKey] = instance;
    } else {
      (target as Record<string, unknown>)[propertyKey] = defaultValue;
    }
  });
}