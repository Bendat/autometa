import type { ClassConstructor } from "../types";
import { recordDecoratorDefault } from "../metadata/storage";

function getConstructor(target: object): ClassConstructor<unknown> {
  if ("constructor" in target && target.constructor) {
    return target.constructor as ClassConstructor<unknown>;
  }
  throw new Error(`Unable to resolve constructor for decorated target: ${String(target)}`);
}

export interface DefaultValueDecoratorSuite {
  value(value: unknown): PropertyDecorator;
  factory(factory: (...args: unknown[]) => unknown): PropertyDecorator;
  dto<T>(ctor: ClassConstructor<T>): PropertyDecorator;
  date(stamp?: number | string): PropertyDecorator;
}

export const DefaultValueDecorators: DefaultValueDecoratorSuite = {
  value: (value: unknown): PropertyDecorator => {
    return (target, propertyKey) => {
      const ctor = getConstructor(target);
      recordDecoratorDefault(ctor, propertyKey, { kind: "value", value });
    };
  },
  factory: (factory: (...args: unknown[]) => unknown): PropertyDecorator => {
    return (target, propertyKey) => {
      const ctor = getConstructor(target);
      recordDecoratorDefault(ctor, propertyKey, { kind: "factory", factory });
    };
  },
  dto: <T>(ctor: ClassConstructor<T>): PropertyDecorator => {
    return (target, propertyKey) => {
      const owner = getConstructor(target);
      recordDecoratorDefault(owner, propertyKey, { kind: "dto", ctor });
    };
  },
  date: (stamp?: number | string): PropertyDecorator => {
    return (target, propertyKey) => {
      const ctor = getConstructor(target);
      const factory = () => {
        if ("number" === typeof stamp) {
          return new Date(stamp);
        }
        if ("string" === typeof stamp && stamp.length > 0) {
          return new Date(stamp);
        }
        return new Date();
      };
      recordDecoratorDefault(ctor, propertyKey, { kind: "factory", factory });
    };
  },
};

export const DTO = {
  value: DefaultValueDecorators.value,
  factory: DefaultValueDecorators.factory,
  dto: DefaultValueDecorators.dto,
  date: DefaultValueDecorators.date,
};

export function Property(defaultOrFactory: unknown | (() => unknown)): PropertyDecorator {
  if ("function" === typeof defaultOrFactory) {
    return DefaultValueDecorators.factory(defaultOrFactory as () => unknown);
  }
  return DefaultValueDecorators.value(defaultOrFactory);
}
