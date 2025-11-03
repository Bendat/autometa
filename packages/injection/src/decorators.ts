import "reflect-metadata";
import type { Container } from "./container";
import { Scope } from "./types";
import type { Identifier, PropertyDep } from "./types";

// Define unique keys for storing metadata via reflect-metadata
const INJECT_PARAM_KEY = "autometa:inject_param";
const INJECT_PROP_KEY = "autometa:inject_prop";

export interface InjectableOptions {
  scope?: Scope;
  deps?: Identifier[];
}

type InjectableTarget = new (...args: unknown[]) => object;

function ensureInjectableTarget(value: unknown, decorator: string): asserts value is InjectableTarget {
  if (typeof value !== "function") {
    throw new TypeError(
      `[${decorator}] can only be used on classes. Received ${typeof value}.`
    );
  }
}

/**
 * Creates a set of decorators bound to a specific container instance.
 * This factory pattern ensures the decorators are decoupled from a global
 * container and can be used with multiple, separate containers.
 * @param container The container instance to which the decorators will register classes.
 */
export function createDecorators(container: Container) {
  /**
   * A class decorator that marks a class as available for injection.
   * It gathers all dependency metadata from `@Inject` decorators and
   * `reflect-metadata` and registers the class with the container.
   */
  function Injectable(options: InjectableOptions = {}): ClassDecorator {
    return (target) => {
      ensureInjectableTarget(target, "Injectable");
      const ctor = target;
      // --- Constructor Injection ---
      const deps = options.deps || [];

      // --- Property Injection ---
      const props =
        (Reflect.getMetadata(INJECT_PROP_KEY, ctor.prototype) as PropertyDep[] | undefined) || [];

      // --- Registration ---
      // The container's `register` method expects an identifier and a binding object.
      const identifier = ctor as unknown as Identifier;
      const binding = {
        type: "class" as const,
        target: ctor,
        scope: options.scope || Scope.TRANSIENT,
        tags: [],
        deps,
        props,
      };

      container.register(identifier, binding);
    };
  }

  /**
   * A decorator that can be used on constructor parameters or class properties
   * to specify a dependency token.
   * @param token The token representing the dependency to inject.
   */
  function Inject(token: Identifier): PropertyDecorator & ParameterDecorator {
    return ((...args: [object, string | symbol, number?]) => {
      const [target, propertyKey, parameterIndex] = args;

      if (typeof parameterIndex === "number") {
        ensureInjectableTarget(target, "Inject parameter");
        const ctor = target;
        const paramTokens =
          (Reflect.getMetadata(INJECT_PARAM_KEY, ctor) as Map<number, Identifier> | undefined) ||
          new Map<number, Identifier>();
        paramTokens.set(parameterIndex, token);
        Reflect.defineMetadata(INJECT_PARAM_KEY, paramTokens, ctor);
        return;
      }

      const props =
        (Reflect.getMetadata(INJECT_PROP_KEY, target) as PropertyDep[] | undefined) || [];
      props.push({ property: propertyKey, token });
      Reflect.defineMetadata(INJECT_PROP_KEY, props, target);
    }) as PropertyDecorator & ParameterDecorator;
  }

  return { Injectable, Inject };
}
