/**
 * Proof of Concept: Container Integration with Decorators
 *
 * This shows how the container could support both decorator systems
 * without breaking the existing clean architecture.
 */

import type {
  Constructor,
  Identifier,
  ResolutionContext,
} from "../src/types.js";

// Common decorator metadata interface
interface DecoratorMetadata {
  index: number;
  identifier: Identifier;
  optional?: boolean;
  tags?: string[];
}

// Decorator registry interface
interface DecoratorRegistry {
  isInjectable(target: Constructor): boolean;
  getParameterMetadata(target: Constructor): DecoratorMetadata[] | undefined;
  getParameterTypes(target: Constructor): Identifier[] | undefined;
}

// Enhanced container with decorator support
export class DecoratorAwareContainer {
  private decoratorRegistry?: DecoratorRegistry;

  constructor(decoratorRegistry?: DecoratorRegistry) {
    this.decoratorRegistry = decoratorRegistry;
  }

  // Enhanced instantiation with decorator support
  private instantiateClass<T>(
    constructor: Constructor<T>,
    context: ResolutionContext
  ): T {
    // Try decorator-based injection if registry is available
    if (this.decoratorRegistry?.isInjectable(constructor)) {
      return this.instantiateWithDecorators(constructor, context);
    }

    // Fall back to simple instantiation (current behavior)
    try {
      return new constructor();
    } catch (error) {
      throw new Error(
        `Cannot instantiate ${constructor.name}: Constructor requires parameters but no dependency metadata available. ` +
          `Consider using factory registration or enabling decorators.`
      );
    }
  }

  private instantiateWithDecorators<T>(
    constructor: Constructor<T>,
    context: ResolutionContext
  ): T {
    if (!this.decoratorRegistry) {
      throw new Error("Decorator registry not available");
    }

    const parameterMetadata =
      this.decoratorRegistry.getParameterMetadata(constructor);
    const parameterTypes =
      this.decoratorRegistry.getParameterTypes(constructor);

    if (!parameterTypes || parameterTypes.length === 0) {
      return new constructor();
    }

    // Resolve dependencies based on metadata
    const dependencies = parameterTypes.map((paramType, index) => {
      // Check for explicit injection metadata
      const metadata = parameterMetadata?.find((meta) => meta.index === index);
      const identifier = metadata?.identifier || paramType;

      if (metadata?.optional) {
        return this.tryResolve(identifier, context);
      }

      return this.resolveWithContext(identifier, context);
    });

    return new constructor(...dependencies);
  }

  // Placeholder methods (would delegate to actual container)
  private tryResolve<T>(
    identifier: Identifier,
    context: ResolutionContext
  ): T | undefined {
    // Implementation would delegate to main container
    return undefined;
  }

  private resolveWithContext<T>(
    identifier: Identifier,
    context: ResolutionContext
  ): T {
    // Implementation would delegate to main container
    throw new Error("Not implemented - would delegate to main container");
  }
}

// Factory function to create decorator-aware container
export function createDecoratorAwareContainer(
  decoratorRegistry?: DecoratorRegistry
) {
  return new DecoratorAwareContainer(decoratorRegistry);
}

// Usage example:
/*
import { createMetadataRegistry } from './unified-decorators';

// Auto-detect and create appropriate registry
const decoratorRegistry = createMetadataRegistry();

// Create container with decorator support
const container = createDecoratorAwareContainer(decoratorRegistry);

// Now the container can handle decorated classes automatically
@injectable
class UserService {
  constructor(
    @inject('database') private db: Database,
    @optional private logger?: Logger
  ) {}
}

container.registerClass(UserService);
const userService = container.resolve(UserService); // Works with constructor injection!
*/

// Integration strategy:
// 1. Keep current Container class clean and decorator-free
// 2. Create DecoratorAwareContainer as an enhanced version
// 3. Allow users to choose: basic container or decorator-enhanced container
// 4. Maintain backward compatibility
