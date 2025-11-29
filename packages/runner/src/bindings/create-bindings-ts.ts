import type { StepExpression } from "@autometa/scopes";
import {
  createContainer,
  createDecorators,
  Scope,
  type Constructor,
  type IContainer,
  type Identifier,
} from "@autometa/injection";
import type { RunnerEnvironment } from "../dsl/create-runner";
import { WORLD_TOKEN } from "../tokens";

// ============================================================================
// TYPES
// ============================================================================

type StepKeyword = "Given" | "When" | "Then" | "And" | "But";

interface StepMethodMetadata {
  readonly propertyKey: string | symbol;
  readonly keyword: StepKeyword;
  readonly expression: StepExpression;
}

interface BindingMetadata {
  readonly steps: StepMethodMetadata[];
}

type StepDecorator = (expression: StepExpression) => MethodDecorator;

/**
 * Surface returned by `runner.bindingsTS()` for TypeScript experimental decorators.
 * Provides class-based step definitions with dependency injection support.
 */
export interface RunnerBindingsSurface<_World> {
  /**
   * Class decorator that marks a class as containing step definitions.
   * The class will be registered with the DI container and its step methods
   * will be automatically registered with the runner.
   */
  readonly Binding: () => ClassDecorator;

  /**
   * Step method decorators - use on methods within a @Binding class.
   */
  readonly Given: StepDecorator;
  readonly When: StepDecorator;
  readonly Then: StepDecorator;
  readonly And: StepDecorator;
  readonly But: StepDecorator;

  /**
   * DI decorators for registering and injecting dependencies.
   */
  readonly Injectable: (options?: { scope?: Scope }) => ClassDecorator;
  readonly Inject: (token: Identifier) => ParameterDecorator & PropertyDecorator;
  readonly LazyInject: (token: Identifier) => PropertyDecorator;

  /**
   * The global container used for registrations.
   * Can be used for advanced scenarios like manual registration.
   */
  readonly container: IContainer;
}

// ============================================================================
// METADATA KEYS
// ============================================================================

const BINDING_METADATA_KEY = Symbol("autometa:binding");
const INJECT_PARAM_KEY = "autometa:inject_param"; // Same key used by createDecorators

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Creates the bindings surface for TypeScript experimental decorators.
 * This provides class-based step definitions with full DI support.
 * 
 * Note: This function requires reflect-metadata to be imported by the user.
 * The import is done lazily to avoid breaking projects that don't use bindings.
 */
export function createBindingsTS<World>(
  stepsEnvironment: RunnerEnvironment<World, Record<string, unknown>>
): RunnerBindingsSurface<World> {
  // Ensure reflect-metadata is available (user must import it)
  if (typeof Reflect === "undefined" || typeof Reflect.getMetadata !== "function") {
    throw new Error(
      "bindingsTS() requires reflect-metadata. " +
      "Add `import 'reflect-metadata'` at the top of your step-definitions file."
    );
  }

  // Create global container for service registrations
  const globalContainer = createContainer();

  // Create DI decorators bound to global container
  const { Inject, LazyInject } = createDecorators(globalContainer);

  // Extract step registration functions from the environment
  const { Given: GivenFn, When: WhenFn, Then: ThenFn, And: AndFn, But: BothFn } = stepsEnvironment;

  // Cache for step class instances per scenario
  const instanceCache = new WeakMap<object, Map<unknown, unknown>>();
  // Cache for scenario containers
  const containerCache = new WeakMap<object, IContainer>();

  /**
   * Get or create a scenario-scoped container.
   */
  function getScenarioContainer(world: World): IContainer {
    const worldObj = world as object;
    let container = containerCache.get(worldObj);
    if (!container) {
      container = globalContainer.createChild();
      container.registerValue(WORLD_TOKEN, world as unknown as Record<string, unknown>);
      containerCache.set(worldObj, container);
    }
    return container;
  }

  /**
   * Get or create a step class instance for the current scenario.
   */
  function getStepInstance<T>(BindingClass: Constructor<T>, world: World): T {
    const worldObj = world as object;
    let cache = instanceCache.get(worldObj);
    if (!cache) {
      cache = new Map();
      instanceCache.set(worldObj, cache);
    }

    let instance = cache.get(BindingClass) as T | undefined;
    if (instance) {
      return instance;
    }

    const container = getScenarioContainer(world);
    instance = container.resolve(BindingClass) as T;
    cache.set(BindingClass, instance);
    return instance;
  }

  /**
   * Get or initialize binding metadata for a class
   */
  function getBindingMetadata(target: object): BindingMetadata {
    let metadata = Reflect.getMetadata(BINDING_METADATA_KEY, target) as BindingMetadata | undefined;
    if (!metadata) {
      metadata = { steps: [] };
      Reflect.defineMetadata(BINDING_METADATA_KEY, metadata, target);
    }
    return metadata;
  }

  /**
   * Get binding metadata from a class
   */
  function getBindingSteps(target: Constructor<unknown>): BindingMetadata | undefined {
    const proto = (target as unknown as { prototype: object }).prototype;
    return Reflect.getMetadata(BINDING_METADATA_KEY, target) ??
      (proto ? Reflect.getMetadata(BINDING_METADATA_KEY, proto) : undefined);
  }

  /**
   * Register a binding class's steps with the runner.
   */
  function registerBindingClass<T>(BindingClass: Constructor<T>): void {
    const metadata = getBindingSteps(BindingClass);
    if (!metadata) {
      return;
    }

    for (const step of metadata.steps) {
      const handler = (...args: unknown[]) => {
        // World is always the last argument from the runner
        const world = args[args.length - 1] as World;
        const stepArgs = args.slice(0, -1);

        const instance = getStepInstance(BindingClass, world) as Record<string | symbol, unknown>;
        const method = instance[step.propertyKey];

        if (typeof method !== "function") {
          throw new Error(`Step method ${String(step.propertyKey)} is not a function`);
        }

        return (method as (...args: unknown[]) => unknown).apply(instance, stepArgs);
      };

      // Register with the appropriate step function
      switch (step.keyword) {
        case "Given":
          GivenFn(step.expression, handler);
          break;
        case "When":
          WhenFn(step.expression, handler);
          break;
        case "Then":
          ThenFn(step.expression, handler);
          break;
        case "And":
          AndFn(step.expression, handler);
          break;
        case "But":
          BothFn(step.expression, handler);
          break;
      }
    }
  }

  // ============================================================================
  // DECORATORS
  // ============================================================================

  /**
   * @Binding class decorator
   */
  function Binding(): ClassDecorator {
    return (target) => {
      // Copy step metadata from prototype to the class itself
      const existing = Reflect.getMetadata(BINDING_METADATA_KEY, target.prototype);
      if (existing) {
        Reflect.defineMetadata(BINDING_METADATA_KEY, existing, target);
      }

      // Read @Inject parameter metadata to build deps array
      const paramTokens = Reflect.getMetadata(INJECT_PARAM_KEY, target) as Map<number, Identifier> | undefined;
      const deps: Identifier[] = [];

      if (paramTokens) {
        const maxIndex = Math.max(...paramTokens.keys());
        for (let i = 0; i <= maxIndex; i++) {
          const token = paramTokens.get(i);
          if (token) {
            deps[i] = token;
          }
        }
      }

      // Register with global container
      globalContainer.registerClass(target as unknown as Constructor<unknown>, {
        scope: Scope.TRANSIENT,
        deps,
      });

      // Register steps with the runner
      registerBindingClass(target as unknown as Constructor<unknown>);
    };
  }

  /**
   * Creates a step method decorator
   */
  function createStepDecorator(keyword: StepKeyword): StepDecorator {
    return (expression: StepExpression): MethodDecorator => {
      return (target, propertyKey, _descriptor) => {
        const metadata = getBindingMetadata(target);
        metadata.steps.push({
          propertyKey,
          keyword,
          expression,
        });
      };
    };
  }

  /**
   * Wrapped @Injectable that allows scope option
   */
  function Injectable(options?: { scope?: Scope }): ClassDecorator {
    return (target) => {
      globalContainer.registerClass(target as unknown as Constructor<unknown>, {
        scope: options?.scope ?? Scope.TRANSIENT,
      });
    };
  }

  return {
    Binding,
    Given: createStepDecorator("Given"),
    When: createStepDecorator("When"),
    Then: createStepDecorator("Then"),
    And: createStepDecorator("And"),
    But: createStepDecorator("But"),
    Injectable,
    Inject,
    LazyInject,
    container: globalContainer,
  };
}
