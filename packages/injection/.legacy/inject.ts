import { Class } from "@autometa/types";
import { metadata } from "./metadata";
import { InjectionToken } from "./token";
import { getConstructor } from "./get-constructor";

export const Inject = {
  /**
   * Decorator factory which defines the Type of the property to inject. This
   * information will be used at class construction to automatically inject
   * that property with the appropriate type. If the type is class which
   * has not been marked as a `Fixture` then the dependency will be treated
   * as cached - meaning once created, the same instance will be used for
   * all subsequent injections. However the target class can be
   * defined as a `Singleton` or `Transient` fixture to override this behavior.
   */
  class: <T>(cls: Class<T> | InjectionToken) => {
    return function (target: unknown, propertyKey: string) {
      metadata(getConstructor(target)).set({
        key: propertyKey,
        class: cls,
      });
    };
  },
  /**
   * Decorator factory which defines a factory function that will
   * be used to inject the property. The factory function will be
   * called once per injection, and it's return value will be
   * used as the value of the property. Currently only synchronous
   * factory functions are supported.
   * @param factory
   * @returns
   */
  factory: <T>(factory: () => T) => {
    return function (target: unknown, propertyKey: string) {
      metadata(getConstructor(target)).set({
        key: propertyKey,
        factory: factory,
      });
    };
  },
  /**
   * Decorator factory which defines a value to inject into the property.
   * The value will be injected directly into the property without any
   * further processing. Equivalent to simply assigning the value to the
   * property.
   *
   * @param value
   * @returns
   */
  value: <T extends Class<unknown> | InjectionToken | string>(value: T) => {
    return function (target: unknown, propertyKey: string) {
      metadata(getConstructor(target)).set({
        key: propertyKey,
        value: value,
      });
    };
  },
};
