import "reflect-metadata";
import { CucumberRunner, WORLD_TOKEN } from "@autometa/runner";
import type { Constructor } from "@autometa/injection";
import { arithmeticWorldDefaults, type ArithmeticWorld } from "../world";
import { ArithmeticSteps, getBindingSteps } from "./arithmetic.steps";
import { globalContainer } from "../decorators";

// Import services to ensure they're registered with globalContainer
import "../services";

// ============================================================================
// RUNNER SETUP
// ============================================================================

const runner = CucumberRunner.builder()
  .withWorld<ArithmeticWorld>(arithmeticWorldDefaults);

export const stepsEnvironment = runner.steps();

const { Given, When, Then, And, But } = stepsEnvironment;

// ============================================================================
// STEP CLASS REGISTRATION
// ============================================================================

// Cache for step class instances per scenario (keyed by world reference)
const instanceCache = new WeakMap<object, Map<unknown, unknown>>();
// Cache for scenario containers (child of globalContainer with WORLD_TOKEN)
const containerCache = new WeakMap<object, ReturnType<typeof globalContainer.createChild>>();

/**
 * Get or create a scenario-scoped container.
 * This is a child of globalContainer with WORLD_TOKEN registered for this scenario.
 */
function getScenarioContainer(world: ArithmeticWorld) {
  let container = containerCache.get(world);
  if (!container) {
    // Create child from globalContainer - inherits all service registrations
    container = globalContainer.createChild();
    // Register WORLD_TOKEN for this scenario
    container.registerValue(WORLD_TOKEN, world as unknown as Record<string, unknown>);
    containerCache.set(world, container);
  }
  return container;
}

/**
 * Get or create a step class instance for the current scenario.
 * Uses a child of globalContainer with WORLD_TOKEN registered.
 */
function getStepInstance<T>(
  BindingClass: Constructor<T>,
  world: ArithmeticWorld
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

  // Get the scenario-scoped container (child of globalContainer)
  const container = getScenarioContainer(world);

  // Resolve the instance - services come from globalContainer, world from this container
  instance = container.resolve(BindingClass) as T;
  cache.set(BindingClass, instance);
  return instance;
}

/**
 * Register a binding class's steps with the runner.
 * Step class instances are created per-scenario with full DI support.
 */
function registerBindingClass<T>(BindingClass: Constructor<T>): void {
  const metadata = getBindingSteps(BindingClass as new (...args: unknown[]) => unknown);
  if (!metadata) {
    console.warn(`No binding metadata found for ${BindingClass.name}`);
    return;
  }

  for (const step of metadata.steps) {
    // Create a handler that lazily gets the instance and calls the method
    const handler = (...args: unknown[]) => {
      // World is always the last argument from the runner
      const world = args[args.length - 1] as ArithmeticWorld;
      const stepArgs = args.slice(0, -1);
      
      // Get or create the step class instance for this scenario
      const instance = getStepInstance(BindingClass, world) as Record<string | symbol, unknown>;
      const method = instance[step.propertyKey];
      
      if (typeof method !== "function") {
        throw new Error(`Step method ${String(step.propertyKey)} is not a function`);
      }

      // Call the method with the step arguments (world is injected via constructor)
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
