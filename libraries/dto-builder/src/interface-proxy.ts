import { metadata } from "@autometa/injection";
import { Class, PropertyMetadata } from "./types";
import { DtoBuilderSymbols } from "./property.enum";
export type IBuilder<T> = {
  [k in keyof T]-?: ((arg: T[k]) => IBuilder<T>) & (() => T[k]);
} & {
  /**
   * Build the object and return it
   */
  build(): T;
  /**
   * Derive a new builder from the current builder, copying it's
   * current values into a new builder. Allows default values to
   * be set in a copy, which will not be modified by child copies.
   */
  derive(): IBuilder<T>;
  /**
   * Assign an arbitrary value to a property. The value
   * does not need to match a valid property for the interface
   * and can be used to introduce "unexpected" values for testing,
   * or coming from other object maps.
   * @param property the name of the property to set a value for
   * @param value the value to set
   */
  assign<K>(property: string, value: K): IBuilder<T>;
  /**
   * Append a value to an array property. If no array
   * has been defined one will be created. If one exists,
   * it will be reused.
   * @param property
   * @param value
   */
  append<K>(property: string, value: K): IBuilder<T>;

  /**
   * Attach a value to a sub-property of a property.
   * If the property does not exist, a new empty object will be
   * assigned to it.
   *
   * The value is appended to the child object indexed by the sub-property.
   * @param property The name of the property to attach key:value pairs to
   * @param subProperty The name of the sub-property to attach the value to
   * @param value The value to attach to the child objects property
   */
  attach<K>(property: string, subProperty: string, value: K): ClsBuilder<T>;
};
export type ClsBuilder<T> = {
  [k in keyof T]-?: BuilderMethod<T, T[k]>;
} & {
  /**
   * Build the object and return it
   */
  build(): T;
  /**
   * Assign an arbitrary value to a property. The value
   * does not need to match a valid property for the interface
   * and can be used to introduce "unexpected" values for testing,
   * or coming from other object maps.
   * @param property the name of the property to set a value for
   * @param value the value to set
   */
  assign<K>(property: string, value: K): ClsBuilder<T>;
  /**
   * Append a value to an array property. If no array
   * has been defined one will be created. If one exists,
   * it will be reused.
   * @param property
   * @param value
   */
  append<K>(property: string, value: K): ClsBuilder<T>;

  /**
   * Attach a value to a sub-property of a property.
   * If the property does not exist, a new empty object will be
   * assigned to it.
   *
   * The value is appended to the child object indexed by the sub-property.
   * @param property The name of the property to attach key:value pairs to
   * @param subProperty The name of the sub-property to attach the value to
   * @param value The value to attach to the child objects property
   */
  attach<K>(property: string, subProperty: string, value: K): ClsBuilder<T>;
};

export type BuilderMethod<TTarget, TType> = ((arg: TType) => ClsBuilder<TTarget>) & {
  value: TType;
};
export type DtoBuilder<T> = Class<ClsBuilder<T>> & {
  /**
   * Construct a builder from a raw object or class instance,
   * inheriting any properties that have already been defined.
   * @param value /
   */
  fromRaw(value: Partial<T>): ClsBuilder<T>;
  /**
   * Constructs a DTO, prefilled with any default values
   * assigned to the DTO via either the `Property` decorator
   * or the `DTO.*` decorators.
   *
   * With property:
   *
   * ```ts
   * class FooDto {
   *  ＠Property(1)
   *  foo: number;
   *  ＠Property(()=> "factory string")
   *  bar: string;
   *  ＠Property(SomeDto)
   *  baz: SomeDto;
   * }
   * ```
   *
   * With DTO:
   *
   * ```ts
   * class FooDto {
   *  ＠DTO.value(1)
   *  foo: number;
   *  ＠DTO.factory(()=> "factory string")
   *  bar: string;
   *  ＠DTO.dto(SomeDto)
   *  baz: SomeDto;
   * }
   * ```
   */
  default(): T;
};

export function Builder<T>(cls: Class<T>): DtoBuilder<T>;
export function Builder<T>(): IBuilder<T>;
export function Builder<T>(defaults?: Partial<T> | Class<T>): IBuilder<T> | DtoBuilder<T> {
  if (isClassBuilder(defaults)) {
    return class BuilderClass<TType> {
      constructor() {
        const built: Record<string, unknown> = { ...defaults };
        const proxy = classProxy.bind(null, defaults as Class<unknown>, built);
        return proxy(this) as BuilderClass<TType>;
      }
      declare build: () => T;
      declare assign: <K>(property: string, value: K) => BuilderClass<TType>;
      static fromRaw(value: T) {
        const builder = new this();
        const keys = Object.keys(value as object) as (keyof T)[];
        for (const key of keys) {
          builder.assign(key.toString(), value[key]);
        }
        return builder;
      }

      static default() {
        return new this().build();
      }
    } as DtoBuilder<T>;
    // return clsBuilder as IBuilder<T>;
  }
  const built: Record<string, unknown> = { ...defaults };
  const builder = new Proxy(built, {
    get(target, prop) {
      if ("build" === prop) {
        return () => built;
      }

      if ("derive" === prop) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return () => Builder<T>({ ...built } as any);
      }

      if ("assign" === prop) {
        return (property: keyof T, value: unknown) => {
          built[property.toString()] = value;
          return target;
        };
      }

      if ("attach" === prop) {
        return (property: keyof T, subProperty: string, value: unknown) => {
          if (typeof built[property.toString()] === undefined) {
            built[property.toString()] = {};
          }
          const dict = built[property.toString()] as Record<string, unknown>;
          dict[subProperty] = value;
          return target;
        };
      }

      if ("append" === prop) {
        return (property: keyof T, value: unknown) => {
          if (!Array.isArray(built[property.toString()])) {
            built[property.toString()] = [value];
          } else {
            (built[property.toString()] as unknown[]).push(value);
          }
          return target;
        };
      }

      return (...args: unknown[]): unknown => {
        // If no arguments passed return current value.
        if (0 === args.length) {
          return built[prop.toString()];
        }

        built[prop.toString()] = args[0];
        return builder;
      };
    },
  });

  return builder as IBuilder<T>;
}

function classProxy<T>(defaults: Class<T>, built: Record<string, unknown>, inst: T) {
  const instance = constructDefaultDto(defaults);
  const clsBuilder = new Proxy(inst as object, {
    get(_, prop) {
      if ("build" === prop) {
        return () => {
          return Object.assign(instance as object, { ...built });
        };
      }
      if ("assign" === prop) {
        const fn = (property: keyof T, value: unknown) => {
          built[property.toString()] = value;
          return clsBuilder;
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return fn as any;
      }
      if ("append" === prop) {
        const fn = (property: keyof T, value: unknown) => {
          if (!Array.isArray(built[property.toString()])) {
            built[property.toString()] = [value];
          } else {
            (built[property.toString()] as unknown[]).push(value);
          }
          return clsBuilder;
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return fn as any;
      }
      if ("attach" === prop) {
        return (property: keyof T, subProperty: string, value: unknown) => {
          if (built[property.toString()] === undefined) {
            built[property.toString()] = {};
          }
          const dict = built[property.toString()] as Record<string, unknown>;
          dict[subProperty] = value;
          return clsBuilder;
        };
      }
      if ((prop) in (inst as Record<string, unknown>)) {
        return (inst as Record<string, unknown>)[prop as string];
      }
      const fn = (...args: unknown[]): unknown => {
        // If no arguments passed return current value.
        if (0 === args.length) {
          return built[prop.toString()];
        }
        built[prop.toString()] = args[0];
        return clsBuilder;
      };
      const modified = Object.defineProperty(fn, "value", {
        get() {
          return built[prop.toString()];
        },
      });
      return modified;
    },
  });
  return clsBuilder as ClsBuilder<T>;
}

function isClassBuilder<T>(cls: unknown): cls is Class<T> {
  return "function" === typeof cls;
}

function constructDefaultDto<T>(base: Class<T>): T {
  const defaultSetters = metadata(base.prototype).getCustom<PropertyMetadata>(
    DtoBuilderSymbols.PROPERTY_DEFAULTS
  );
  const instance = new base();
  if (!defaultSetters) {
    return instance;
  }
  const keys = Object.keys(defaultSetters) as unknown as (keyof typeof instance)[] &
    (keyof typeof defaultSetters)[];

  for (const key of keys) {
    const value = defaultSetters[key];
    if ("value" in value) {
      Object.defineProperty(instance as object, key, {
        value: value.value,
        writable: true,
        enumerable: true,
      });
    }
    if ("factory" in value) {
      Object.defineProperty(instance as object, key, {
        value: value.factory(),
        writable: true,
        enumerable: true,
      });
    }
    if ("dtoType" in value) {
      const dtoInst = constructDefaultDto(value.dtoType);
      Object.defineProperty(instance as object, key, {
        value: dtoInst,
        writable: true,
        enumerable: true,
      });
    }
  }
  return instance;
}
