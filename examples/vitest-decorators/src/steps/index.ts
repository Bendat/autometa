import "reflect-metadata";
import { CucumberRunner, WORLD_TOKEN } from "@autometa/runner";
import { Scope, type IContainer } from "@autometa/injection";
import { arithmeticWorldDefaults, type ArithmeticWorld } from "../world";
import { ArithmeticSteps, getBindingSteps } from "./arithmetic.steps";

// Token for step class instances
const STEP_CLASS_TOKEN = Symbol("autometa:step_class");

// Create the runner builder with world
const runner = CucumberRunner.builder()
  .withWorld<ArithmeticWorld>(arithmeticWorldDefaults);

// Get the steps environment
export const stepsEnvironment = runner.steps();

// Extract the step registration functions
const { Given, When, Then, And, But } = stepsEnvironment;

// Cache for step class instances per scenario (keyed by world reference)
const instanceCache = new WeakMap<object, Map<unknown, unknown>>();

/**
 * Get or create a step class instance for the current scenario.
 * Uses the world's DI container to resolve dependencies.
 */
function getStepInstance<T>(
  BindingClass: new (...args: unknown[]) => T,
  world: ArithmeticWorld & { di?: IContainer }
): T {
  // Get or create the instance cache for this world
  let cache = instanceCache.get(world);
  if (!cache) {
    cache = new Map();
    instanceCache.set(world, cache);
  }

  // Check if we already have an instance for this class
  let instance = cache.get(BindingClass) as T | undefined;
  if (instance) {
    return instance;
  }

  // Create a new instance using DI if available
  if (world.di) {
    // Register the class with the container if not already registered
    try {
      world.di.register(BindingClass, {
        type: "class",
        target: BindingClass,
        scope: Scope.SCENARIO,
        tags: [],
        deps: [WORLD_TOKEN], // Inject world as first constructor parameter
        props: [],
      });
    } catch {
      // Class may already be registered
    }
    
    // Resolve the instance
    instance = world.di.resolve(BindingClass) as T;
  } else {
    // Fallback: create instance with world as first parameter
    instance = new BindingClass(world) as T;
  }

  cache.set(BindingClass, instance);
  return instance;
}

/**
 * Register a binding class's steps with the runner.
 * 
 * This bridges the decorator-based step definitions to the functional API.
 * Step class instances are created per-scenario with DI support.
 */
function registerBindingClass<T extends new (...args: unknown[]) => unknown>(
  BindingClass: T
): void {
  const metadata = getBindingSteps(BindingClass);
  if (!metadata) {
    console.warn(`No binding metadata found for ${BindingClass.name}`);
    return;
  }

  for (const step of metadata.steps) {
    // Create a handler that lazily gets the instance and calls the method
    // The world is the last parameter from the runner
    const handler = (...args: unknown[]) => {
      // World is always the last argument
      const world = args[args.length - 1] as ArithmeticWorld & { di?: IContainer };
      const stepArgs = args.slice(0, -1);
      
      // Get or create the step class instance for this scenario
      const instance = getStepInstance(BindingClass, world) as Record<string | symbol, unknown>;
      const method = instance[step.propertyKey];
      
      if (typeof method !== "function") {
        throw new Error(`Step method ${String(step.propertyKey)} is not a function`);
      }

      // Call the method with the step arguments (no world - it's injected via constructor)
      return (method as (...args: unknown[]) => unknown).apply(instance, stepArgs);
    };

    // Register with the appropriate step function
    switch (step.keyword) {
      case "Given":
        Given(step.expression, handler);
        break;
      case "When":
        When(step.expression, handler);
        break;
      case "Then":
        Then(step.expression, handler);
        break;
      case "And":
        And(step.expression, handler);
        break;
      case "But":
        But(step.expression, handler);
        break;
    }
  }
}

// Register all binding classes
registerBindingClass(ArithmeticSteps);

// Re-export for use in other step files
export { Given, When, Then, And, But };
