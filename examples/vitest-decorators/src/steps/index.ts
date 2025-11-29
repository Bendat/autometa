import "reflect-metadata";
import { CucumberRunner } from "@autometa/runner";
import { arithmeticWorldDefaults, type ArithmeticWorld } from "../world";
import { ArithmeticSteps, getBindingSteps } from "./arithmetic.steps";

// Create the runner builder with world
const runner = CucumberRunner.builder()
  .withWorld<ArithmeticWorld>(arithmeticWorldDefaults);

// Get the steps environment
export const stepsEnvironment = runner.steps();

// Extract the step registration functions
const { Given, When, Then, And, But } = stepsEnvironment;

/**
 * Register a binding class's steps with the runner.
 * 
 * This bridges the decorator-based step definitions to the functional API.
 * The step methods receive (params..., world) and can access instance methods.
 */
function registerBindingClass<T extends new (...args: unknown[]) => unknown>(
  BindingClass: T
): void {
  const metadata = getBindingSteps(BindingClass);
  if (!metadata) {
    console.warn(`No binding metadata found for ${BindingClass.name}`);
    return;
  }

  // Create a single instance that all steps will use
  // In a full DI implementation, this would be per-scenario with proper injection
  const instance = new BindingClass() as Record<string | symbol, unknown>;

  for (const step of metadata.steps) {
    const method = instance[step.propertyKey];
    if (typeof method !== "function") {
      console.warn(`Step method ${String(step.propertyKey)} is not a function`);
      continue;
    }

    // Create a bound handler that calls the instance method
    // The handler receives (params..., world) from the runner
    const handler = (...args: unknown[]) => {
      return (method as (...args: unknown[]) => unknown).apply(instance, args);
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
