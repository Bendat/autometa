/**
 * Experimental Decorators Implementation
 * Requires: experimentalDecorators: true, emitDecoratorMetadata: true
 */

import 'reflect-metadata';

// Metadata keys for experimental decorators
export const EXPERIMENTAL_METADATA_KEYS = {
  INJECTABLE: Symbol('injectable'),
  INJECT: Symbol('inject'),
  OPTIONAL: Symbol('optional'),
  TAGGED: Symbol('tagged'),
  PARAMETERS: Symbol('parameters')
} as const;

// Parameter metadata interface
export interface ExperimentalParameterMetadata {
  index: number;
  identifier: any;
  optional?: boolean;
  tags?: string[];
}

// Experimental @injectable decorator
export function injectable<T extends new (...args: any[]) => any>(target: T): T {
  Reflect.defineMetadata(EXPERIMENTAL_METADATA_KEYS.INJECTABLE, true, target);
  return target;
}

// Experimental @inject decorator
export function inject(identifier: any) {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingMetadata: ExperimentalParameterMetadata[] = 
      Reflect.getMetadata(EXPERIMENTAL_METADATA_KEYS.PARAMETERS, target) || [];
    
    existingMetadata.push({
      index: parameterIndex,
      identifier
    });
    
    Reflect.defineMetadata(EXPERIMENTAL_METADATA_KEYS.PARAMETERS, existingMetadata, target);
  };
}

// Experimental @optional decorator
export function optional(target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
  const existingMetadata: ExperimentalParameterMetadata[] = 
    Reflect.getMetadata(EXPERIMENTAL_METADATA_KEYS.PARAMETERS, target) || [];
  
  // Find existing metadata for this parameter and mark as optional
  const existing = existingMetadata.find(meta => meta.index === parameterIndex);
  if (existing) {
    existing.optional = true;
  } else {
    existingMetadata.push({
      index: parameterIndex,
      identifier: undefined, // Will be inferred from design:paramtypes
      optional: true
    });
  }
  
  Reflect.defineMetadata(EXPERIMENTAL_METADATA_KEYS.PARAMETERS, existingMetadata, target);
}

// Experimental @tagged decorator
export function tagged(...tags: string[]) {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingMetadata: ExperimentalParameterMetadata[] = 
      Reflect.getMetadata(EXPERIMENTAL_METADATA_KEYS.PARAMETERS, target) || [];
    
    const existing = existingMetadata.find(meta => meta.index === parameterIndex);
    if (existing) {
      existing.tags = [...(existing.tags || []), ...tags];
    } else {
      existingMetadata.push({
        index: parameterIndex,
        identifier: undefined,
        tags
      });
    }
    
    Reflect.defineMetadata(EXPERIMENTAL_METADATA_KEYS.PARAMETERS, existingMetadata, target);
  };
}

// Helper functions for experimental decorators
export function getExperimentalMetadata(key: symbol, target: any): any {
  return Reflect.getMetadata(key, target);
}

export function isInjectable(target: any): boolean {
  return !!Reflect.getMetadata(EXPERIMENTAL_METADATA_KEYS.INJECTABLE, target);
}

export function getParameterTypes(target: any): any[] | undefined {
  return Reflect.getMetadata('design:paramtypes', target);
}

export function getParameterMetadata(target: any): ExperimentalParameterMetadata[] | undefined {
  return Reflect.getMetadata(EXPERIMENTAL_METADATA_KEYS.PARAMETERS, target);
}

// Example usage:
/*
@injectable
class UserService {
  constructor(
    @inject('database') private db: Database,
    @optional private logger?: Logger,
    @tagged('cache', 'redis') private cache: Cache
  ) {}
}
*/
