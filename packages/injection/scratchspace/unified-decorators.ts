/**
 * Unified Decorator Abstraction
 * 
 * This provides a common interface that can work with both:
 * - Experimental decorators (with reflect-metadata)
 * - ES decorators (TC39 Stage 3)
 * 
 * Strategy: Dual export pattern - user chooses based on their TypeScript config
 */

import type { Constructor, Identifier } from '../src/types';

// Common metadata interface
export interface ParameterMetadata {
  index: number;
  identifier: Identifier;
  optional?: boolean;
  tags?: string[];
}

// Common metadata registry interface
export interface MetadataRegistry {
  setInjectable(target: Constructor): void;
  isInjectable(target: Constructor): boolean;
  setParameterMetadata(target: Constructor, metadata: ParameterMetadata[]): void;
  getParameterMetadata(target: Constructor): ParameterMetadata[] | undefined;
  getParameterTypes(target: Constructor): Identifier[] | undefined;
}

// Detection function to determine which decorator system is active
export function detectDecoratorSystem(): 'experimental' | 'es' | 'none' {
  // Check if reflect-metadata is available (experimental decorators)
  if (typeof Reflect !== 'undefined' && 'getMetadata' in Reflect) {
    return 'experimental';
  }
  
  // Check if Symbol.metadata exists (ES decorators)
  if (typeof Symbol !== 'undefined' && 'metadata' in Symbol) {
    return 'es';
  }
  
  return 'none';
}

// Experimental decorators implementation
export class ExperimentalMetadataRegistry implements MetadataRegistry {
  private static readonly INJECTABLE_KEY = Symbol('injectable');
  private static readonly PARAMETERS_KEY = Symbol('parameters');

  setInjectable(target: Constructor): void {
    if (typeof Reflect !== 'undefined' && 'defineMetadata' in Reflect) {
      (Reflect as any).defineMetadata(ExperimentalMetadataRegistry.INJECTABLE_KEY, true, target);
    }
  }

  isInjectable(target: Constructor): boolean {
    if (typeof Reflect !== 'undefined' && 'getMetadata' in Reflect) {
      return !!(Reflect as any).getMetadata(ExperimentalMetadataRegistry.INJECTABLE_KEY, target);
    }
    return false;
  }

  setParameterMetadata(target: Constructor, metadata: ParameterMetadata[]): void {
    if (typeof Reflect !== 'undefined' && 'defineMetadata' in Reflect) {
      (Reflect as any).defineMetadata(ExperimentalMetadataRegistry.PARAMETERS_KEY, metadata, target);
    }
  }

  getParameterMetadata(target: Constructor): ParameterMetadata[] | undefined {
    if (typeof Reflect !== 'undefined' && 'getMetadata' in Reflect) {
      return (Reflect as any).getMetadata(ExperimentalMetadataRegistry.PARAMETERS_KEY, target);
    }
    return undefined;
  }

  getParameterTypes(target: Constructor): Identifier[] | undefined {
    if (typeof Reflect !== 'undefined' && 'getMetadata' in Reflect) {
      return (Reflect as any).getMetadata('design:paramtypes', target);
    }
    return undefined;
  }
}

// ES decorators implementation (simplified - mainly for future use)
export class ESMetadataRegistry implements MetadataRegistry {
  private static readonly registry = new WeakMap<Constructor, {
    injectable?: boolean;
    parameters?: ParameterMetadata[];
  }>();

  setInjectable(target: Constructor): void {
    const metadata = ESMetadataRegistry.registry.get(target) || {};
    metadata.injectable = true;
    ESMetadataRegistry.registry.set(target, metadata);
  }

  isInjectable(target: Constructor): boolean {
    const metadata = ESMetadataRegistry.registry.get(target);
    return !!metadata?.injectable;
  }

  setParameterMetadata(target: Constructor, parameters: ParameterMetadata[]): void {
    const metadata = ESMetadataRegistry.registry.get(target) || {};
    metadata.parameters = parameters;
    ESMetadataRegistry.registry.set(target, metadata);
  }

  getParameterMetadata(target: Constructor): ParameterMetadata[] | undefined {
    const metadata = ESMetadataRegistry.registry.get(target);
    return metadata?.parameters;
  }

  getParameterTypes(target: Constructor): Identifier[] | undefined {
    // ES decorators don't automatically emit type information
    // This would need to be manually registered or inferred
    return undefined;
  }
}

// Factory function to get the appropriate registry
export function createMetadataRegistry(): MetadataRegistry {
  const system = detectDecoratorSystem();
  
  switch (system) {
    case 'experimental':
      return new ExperimentalMetadataRegistry();
    case 'es':
      return new ESMetadataRegistry();
    default:
      // Fallback to ES implementation for manual registration
      return new ESMetadataRegistry();
  }
}

// Singleton registry instance
export const metadataRegistry = createMetadataRegistry();

// Unified decorator factory functions
export function createInjectableDecorator(registry: MetadataRegistry = metadataRegistry) {
  return function injectable<T extends Constructor>(target: T): T {
    registry.setInjectable(target);
    return target;
  };
}

export function createInjectDecorator(registry: MetadataRegistry = metadataRegistry) {
  return function inject(identifier: Identifier) {
    return function (target: Constructor, propertyKey: string | symbol | undefined, parameterIndex: number) {
      const existingMetadata = registry.getParameterMetadata(target) || [];
      existingMetadata.push({
        index: parameterIndex,
        identifier
      });
      registry.setParameterMetadata(target, existingMetadata);
    };
  };
}

export function createOptionalDecorator(registry: MetadataRegistry = metadataRegistry) {
  return function optional(target: Constructor, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingMetadata = registry.getParameterMetadata(target) || [];
    const existing = existingMetadata.find(meta => meta.index === parameterIndex);
    if (existing) {
      existing.optional = true;
    } else {
      existingMetadata.push({
        index: parameterIndex,
        identifier: undefined as any, // Will be inferred from types
        optional: true
      });
    }
    registry.setParameterMetadata(target, existingMetadata);
  };
}

// Default decorators using the auto-detected registry
export const injectable = createInjectableDecorator();
export const inject = createInjectDecorator();
export const optional = createOptionalDecorator();
