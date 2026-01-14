/**
 * @autometa/injection - Dependency Injection Framework
 * 
 * A modern, type-safe dependency injection framework with:
 * - Container-based system with child container support
 * - Class, value, factory, and token-based registration
 * - Scoped instances (singleton, transient, request, session)
 * - Circular dependency detection
 * - Lazy resolution
 */

// Core types
export * from './types';

// Container implementation
export * from './container';
export * from './decorators';

// Re-export commonly used items for convenience
export {
  Container,
  createContainer,
  createChildContainer
} from './container';

export {
  Scope,
  createToken,
  type IContainer,
  type Identifier,
  type Constructor,
  type Token
} from './types';
