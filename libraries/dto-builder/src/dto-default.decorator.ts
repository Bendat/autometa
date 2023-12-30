import { metadata } from "@autometa/injection";
import { DtoBuilderSymbols } from "./property.enum";
import { Class, PropertyMetadata } from "./types";
import "any-date-parser";

export interface Default {
  value(value: unknown): PropertyDecorator;

  factory(factory: (...args: unknown[]) => unknown): PropertyDecorator;

  dto(dtoType: Class<unknown>): PropertyDecorator;

  date(): PropertyDecorator;
  date(format: string): PropertyDecorator;
  date(stamp: number): PropertyDecorator;
  date(stamp?: string | number): PropertyDecorator;
}


export const DefaultValueDecorators: Default = {
  value: (value: unknown) => (target: object, propertyKey: string | symbol) => {
    const container = metadata(target as Class<unknown>).custom<PropertyMetadata>(
      DtoBuilderSymbols.PROPERTY_DEFAULTS,
      {},
      false
    );
    const datum = { value };
    container[propertyKey as string] = datum;
  },
  factory:
    (factory: (...args: unknown[]) => unknown) =>
    (target: object, propertyKey: string | symbol) => {
      const container = metadata(target as Class<unknown>).custom<PropertyMetadata>(
        DtoBuilderSymbols.PROPERTY_DEFAULTS,
        {},
        false
      );
      const datum = { factory };
      container[propertyKey as string] = datum;
    },
  dto: (dtoType: Class<unknown>) => (target: object, propertyKey: string | symbol) => {
    const container = metadata(target as Class<unknown>).custom<PropertyMetadata>(
      DtoBuilderSymbols.PROPERTY_DEFAULTS,
      {},
      false
    );
    const datum = { dtoType };
    container[propertyKey as string] = datum;
  },
  date: (stamp?: string | number | undefined) => {
    return (target: object, propertyKey: string | symbol) => {
      const container = metadata(target as Class<unknown>).custom<PropertyMetadata>(
        DtoBuilderSymbols.PROPERTY_DEFAULTS,
        {},
        false
      );
      const datum = {
        factory: () => {
          if ("number" === typeof stamp) {
            return new Date(stamp);
          }
          if (!stamp) {
            return new Date();
          }
          return (Date as unknown as { fromString: (s: string) => Date }).fromString(stamp);
        },
      };
      container[propertyKey as string] = datum;
    };
  },
};
