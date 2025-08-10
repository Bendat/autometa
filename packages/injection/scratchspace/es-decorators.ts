/**
 * ES Decorators Implementation (TC39 Stage 3)
 * Requires: experimentalDecorators: false (default in TS 5.0+)
 * Uses the new decorator context API
 */

// ES Decorators use context.metadata for storage
export const ES_METADATA_KEYS = {
  INJECTABLE: Symbol('es-injectable'),
  INJECT: Symbol('es-inject'),
  OPTIONAL: Symbol('es-optional'),
  TAGGED: Symbol('es-tagged'),
  PARAMETERS: Symbol('es-parameters')
} as const;

// Parameter metadata for ES decorators
export interface ESParameterMetadata {
  index: number;
  identifier: unknown;
  optional?: boolean;
  tags?: string[];
}

// Type for constructor
type Constructor = new (...args: unknown[]) => object;

// ES @injectable decorator
export function injectable<T extends Constructor>(
  target: T, 
  context: ClassDecoratorContext<T>
): T {
  context.metadata[ES_METADATA_KEYS.INJECTABLE] = true;
  return target;
}

// ES @inject decorator
export function inject(identifier: unknown) {
  return function (
    target: unknown, 
    context: ClassFieldDecoratorContext | ClassMethodDecoratorContext
  ) {
    if (context.kind === 'field') {
      // For field injection
      const existingMetadata = (context.metadata[ES_METADATA_KEYS.PARAMETERS] as ESParameterMetadata[]) || [];
      existingMetadata.push({
        index: -1, // Field injection doesn't have parameter index
        identifier
      });
      context.metadata[ES_METADATA_KEYS.PARAMETERS] = existingMetadata;
    }
  };
}

// ES @optional decorator
export function optional(
  target: unknown, 
  context: ClassFieldDecoratorContext | ClassMethodDecoratorContext
) {
  if (context.kind === 'field') {
    const existingMetadata = (context.metadata[ES_METADATA_KEYS.PARAMETERS] as ESParameterMetadata[]) || [];
    // Find the last metadata entry (should be for this field) and mark as optional
    const lastEntry = existingMetadata[existingMetadata.length - 1];
    if (lastEntry) {
      lastEntry.optional = true;
    } else {
      existingMetadata.push({
        index: -1,
        identifier: undefined,
        optional: true
      });
    }
    context.metadata[ES_METADATA_KEYS.PARAMETERS] = existingMetadata;
  }
}

// ES @tagged decorator
export function tagged(...tags: string[]) {
  return function (
    target: unknown, 
    context: ClassFieldDecoratorContext | ClassMethodDecoratorContext
  ) {
    if (context.kind === 'field') {
      const existingMetadata = (context.metadata[ES_METADATA_KEYS.PARAMETERS] as ESParameterMetadata[]) || [];
      const lastEntry = existingMetadata[existingMetadata.length - 1];
      if (lastEntry) {
        lastEntry.tags = [...(lastEntry.tags || []), ...tags];
      } else {
        existingMetadata.push({
          index: -1,
          identifier: undefined,
          tags
        });
      }
      context.metadata[ES_METADATA_KEYS.PARAMETERS] = existingMetadata;
    }
  };
}

// Helper functions for ES decorators
export function getESMetadata(key: symbol, target: Constructor): unknown {
  // In ES decorators, metadata is stored on the constructor
  const metadata = (target as Constructor & { [Symbol.metadata]?: Record<symbol, unknown> })[Symbol.metadata];
  return metadata?.[key];
}

export function isESInjectable(target: Constructor): boolean {
  return !!getESMetadata(ES_METADATA_KEYS.INJECTABLE, target);
}

export function getESParameterMetadata(target: Constructor): ESParameterMetadata[] | undefined {
  return getESMetadata(ES_METADATA_KEYS.PARAMETERS, target) as ESParameterMetadata[] | undefined;
}

// Example usage (with ES decorators):
/*
@injectable
class UserService {
  @inject('database')
  private db!: Database;
  
  @optional
  @inject('logger')
  private logger?: Logger;
  
  @tagged('cache', 'redis')
  @inject('cache')
  private cache!: Cache;
}
*/

// Note: ES decorators work differently for constructor parameters
// They're better suited for field injection rather than constructor parameter injection
// For constructor parameters, we might need a different approach or hybrid solution
