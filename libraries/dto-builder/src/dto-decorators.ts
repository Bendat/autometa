import "reflect-metadata";
import { BuilderClass } from "./types";
function decorator(target: BuilderClass<unknown>, key: string) {
  if (!Reflect.hasMetadata("dto:isDto", target)) {
    Reflect.defineMetadata("dto:isDto", true, target);
  }
  if (!Reflect.hasMetadata("dto:properties", target)) {
    Reflect.defineMetadata("dto:properties", [], target);
  }
  Reflect.getMetadata("dto:properties", target).push(key);
  Reflect.defineMetadata("dto:meta", 1, target, key);
}
function argdecorator<T>(arg: T, transformer?: FromRawTransformer) {
  return function (target: BuilderClass<unknown>, key: string) {
    if (!Reflect.hasMetadata("dto:default", target, key)) {
      Reflect.defineMetadata("dto:default", [], target, key);
    }
    if (!Reflect.hasMetadata("dto:transformer", target, key)) {
      Reflect.defineMetadata("dto:transformer", [], target, key);
    }
    Reflect.defineMetadata("dto:default", arg, target, key);
    Reflect.defineMetadata("dto:transformer", transformer, target, key);
    decorator(target, key);
  };
}

type decoratorFunction = (
  target: { constructor: { name: string } },
  propertyKey: string | symbol
) => void;

type FromRawTransformer = <T, K>(value: T) => K;

export function Property(transformer?: FromRawTransformer): decoratorFunction;
export function Property<T>(defaultValue: T, transformer?: FromRawTransformer): decoratorFunction;
export function Property<T>(target: T, propertyKey: string | symbol, descriptor?: never): void;
export function Property<T>(...args: unknown[]): unknown | decoratorFunction {
  if (args?.length > 2) {
    const [target, key] = args as [BuilderClass<unknown>, string];
    return decorator(target, key);
  }
  if (typeof args[0] === "function" && !isClass(args[0])) {
    const [transformer] = args as [FromRawTransformer];
    return argdecorator(undefined, transformer);
  }
  const [defaultValue, transformer] = args as [T, FromRawTransformer];
  return argdecorator(defaultValue, transformer);
}

export function makeDtoDefaults<T>(target: BuilderClass<T>): T {
  const type = target.prototype ? target.prototype : target;
  const properties: string[] = Reflect.getMetadata("dto:properties", type);
  const instance = new target();
  const instanceDict = instance as Record<string, unknown>;
  if (!properties || properties?.length === 0) {
    return instance;
  }
  for (const property of properties) {
    const defaultValue = Reflect.getMetadata("dto:default", type, property);
    if (defaultValue?.prototype && Reflect.getMetadata("dto:isDto", defaultValue.prototype)) {
      instanceDict[property] = makeDtoDefaults(defaultValue);
      continue;
    }

    if(defaultValue && defaultValue instanceof Date.constructor){
      instanceDict[property] = new Date();
    }

    if (typeof defaultValue === "function") {
      const value = defaultValue();
      if(value && 'then' in value && typeof value.then === 'function'){
        throw new Error(`Default value for ${property} is an async function. This is not supported. Please use a sync function or a value.`)
      }
      instanceDict[property] = value;
    }
    if (defaultValue !== undefined) {
      instanceDict[property] = defaultValue;
    }
  }
  return instance;
}
function isClass(func: unknown) {
  return typeof func === "function" && /^class\s/.test(Function.prototype.toString.call(func));
}
export function makeDtoFromRaw<T, K>(prototype: BuilderClass<T>, type: K): T {
  const blueprint = prototype.prototype ? prototype.prototype : prototype;
  const properties: string[] = Reflect.getMetadata("dto:properties", blueprint);
  const dto = new prototype();
  const instanceDict = dto as Record<string, unknown>;
  if (!properties || properties?.length === 0) {
    return dto;
  }
  for (const property of properties) {
    const defaultValue = Reflect.getMetadata("dto:default", blueprint, property);
    const rawProperty = Reflect.get(type as object, property) as object;
    const rawTransformer = Reflect.getMetadata("dto:transformer", blueprint, property);
    if (rawProperty === undefined) {
      continue;
    }
    if (defaultValue?.prototype && Reflect.getMetadata("dto:isDto", defaultValue.prototype)) {
      instanceDict[property] = makeDtoFromRaw(defaultValue, rawProperty);
      continue;
    }
    const propertyAsArg = rawTransformer ? rawTransformer(rawProperty) : rawProperty;
    instanceDict[property] = propertyAsArg;
  }
  return dto;
}
