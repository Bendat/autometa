import "reflect-metadata";
import type { StepExpression } from "@autometa/scopes";
import { createContainer, createDecorators, Scope, type Identifier } from "@autometa/injection";

// ============================================================================
// GLOBAL CONTAINER
// ============================================================================

/**
 * Global container for registering services at module load time.
 * Step classes and services decorated with @Injectable() are registered here.
 * At runtime, child containers are created per-scenario inheriting these registrations.
 */
export const globalContainer = createContainer();

/**
 * DI decorators bound to the global container.
 * Use @Injectable() on services and step classes.
 * Use @Inject(token) for constructor parameter injection.
 */
export const { Injectable, Inject, LazyInject } = createDecorators(globalContainer);

// ============================================================================
// STEP BINDING METADATA
// ============================================================================

const BINDING_METADATA_KEY = Symbol("autometa:binding");
const INJECT_PARAM_KEY = "autometa:inject_param"; // Same key used by createDecorators

type StepKeyword = "Given" | "When" | "Then" | "And" | "But";

export interface StepMethodMetadata {
  readonly propertyKey: string | symbol;
  readonly keyword: StepKeyword;
  readonly expression: StepExpression;
}

export interface BindingMetadata {
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

// ============================================================================
// STEP DECORATORS
// ============================================================================

/**
 * @Binding class decorator - marks a class as containing step definitions.
 * Also registers the class with the global DI container as a transient service.
 * Reads @Inject parameter metadata to determine constructor dependencies.
 */
export function Binding(): ClassDecorator {
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
      // Build deps array in parameter order
      const maxIndex = Math.max(...paramTokens.keys());
      for (let i = 0; i <= maxIndex; i++) {
        const token = paramTokens.get(i);
        if (token) {
          deps[i] = token;
        }
      }
    }
    
    // Register the binding class with the global container
    globalContainer.registerClass(target as unknown as new (...args: unknown[]) => unknown, {
      scope: Scope.TRANSIENT,
      deps,
    });
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

/** @Given step decorator */
export const Given = createStepDecorator("Given");

/** @When step decorator */
export const When = createStepDecorator("When");

/** @Then step decorator */
export const Then = createStepDecorator("Then");

/** @And step decorator */
export const And = createStepDecorator("And");

/** @But step decorator */
export const But = createStepDecorator("But");

/**
 * Get the binding metadata from a class
 */
export function getBindingSteps(target: new (...args: unknown[]) => unknown): BindingMetadata | undefined {
  return Reflect.getMetadata(BINDING_METADATA_KEY, target) ?? 
         Reflect.getMetadata(BINDING_METADATA_KEY, target.prototype);
}
