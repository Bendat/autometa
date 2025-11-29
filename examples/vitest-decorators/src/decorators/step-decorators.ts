import "reflect-metadata";
import type { StepExpression } from "@autometa/scopes";

// Metadata keys
const STEP_METADATA_KEY = Symbol("autometa:step_methods");
const BINDING_METADATA_KEY = Symbol("autometa:binding");

type StepKeyword = "Given" | "When" | "Then" | "And" | "But";

interface StepMethodMetadata {
  readonly propertyKey: string | symbol;
  readonly keyword: StepKeyword;
  readonly expression: StepExpression;
}

interface BindingMetadata {
  readonly steps: StepMethodMetadata[];
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
 * @Binding class decorator - marks a class as containing step definitions
 */
export function Binding(): ClassDecorator {
  return (target) => {
    // The binding metadata is already attached by the step decorators
    // This decorator just marks the class for discovery
    const existing = Reflect.getMetadata(BINDING_METADATA_KEY, target.prototype);
    if (existing) {
      Reflect.defineMetadata(BINDING_METADATA_KEY, existing, target);
    }
  };
}

/**
 * Creates a step method decorator
 */
function createStepDecorator(keyword: StepKeyword) {
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
 * @Given step decorator
 */
export const Given = createStepDecorator("Given");

/**
 * @When step decorator  
 */
export const When = createStepDecorator("When");

/**
 * @Then step decorator
 */
export const Then = createStepDecorator("Then");

/**
 * @And step decorator
 */
export const And = createStepDecorator("And");

/**
 * @But step decorator
 */
export const But = createStepDecorator("But");

/**
 * Get the binding metadata from a class
 */
export function getBindingSteps(target: new (...args: unknown[]) => unknown): BindingMetadata | undefined {
  return Reflect.getMetadata(BINDING_METADATA_KEY, target) ?? 
         Reflect.getMetadata(BINDING_METADATA_KEY, target.prototype);
}
