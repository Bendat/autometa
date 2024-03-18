import { DefaultValueDecorators } from "./dto-default.decorator";
import type { Class } from "./types";

/**
 *
 * @param defaultValue
 *
 * @deprecated Use `@DTO.value`, `@DTO.factory` and `@DTO.dto` instead
 */
export function Property<T extends () => unknown>(defaultValue: T): PropertyDecorator;
export function Property<T>(defaultValue: T): PropertyDecorator;
export function Property(defaultOrFactory: unknown | (() => unknown)): PropertyDecorator {
  return determineDefaultType(defaultOrFactory);
}
function determineDefaultType(
  defaultOrFactory: unknown | Class<unknown> | (() => unknown)
): PropertyDecorator {
  if (isClass(defaultOrFactory)) {
    return DefaultValueDecorators.dto(defaultOrFactory);
  }

  if ("function" === typeof defaultOrFactory) {
    return DefaultValueDecorators.factory(defaultOrFactory as () => unknown);
  }

  if (defaultOrFactory instanceof Date.constructor) {
    return DefaultValueDecorators.date();
  }

  return DefaultValueDecorators.value(defaultOrFactory);
}

function isClass(value: unknown): value is Class<unknown> {
  if (!("function" != typeof value)) {
    return false;
  }

  return /^class[\s{]/.test(toString.call(value));
}
