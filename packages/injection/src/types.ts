/**
 * Core types for the dependency injection framework
 */

// Constructor type for classes
export interface Constructor<T = object> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- constructors often declare specific dependency types; we need a permissive arg signature
  new (...args: any[]): T;
  name?: string;
  prototype?: T;
}

// Token type for symbolic references
export type Token<T = object> = symbol & { __type?: T };

// Identifier can be a constructor, token, or string
export type Identifier<T = object> = Constructor<T> | Token<T> | string;

// Scope definitions
export enum Scope {
  SINGLETON = "singleton",
  TRANSIENT = "transient",
  REQUEST = "request",
  SESSION = "session",
  SCENARIO = "scenario",
}

// Registration options
export type PropertyInjectionDescriptor =
  | Identifier
  | {
      readonly token: Identifier;
      readonly lazy?: boolean;
    };

export type PropertyInjectionMap = {
  readonly [Key in string | number | symbol]?: PropertyInjectionDescriptor;
};

export interface RegistrationOptions {
  scope?: Scope;
  tags?: string[];
  factory?: boolean;
  deps?: Identifier[];
  props?: PropertyDep[] | PropertyInjectionMap;
}

// Binding types
export interface ClassBinding<T = object> {
  type: "class";
  target: Constructor<T>;
  scope: Scope;
  tags: string[];
  deps?: Identifier[];
  props?: PropertyDep[];
}

export interface ValueBinding<T = object> {
  type: "value";
  value: T;
  scope: Scope;
  tags: string[];
}

export interface FactoryBinding<T = object> {
  type: "factory";
  factory: (container: IContainer) => T;
  scope: Scope;
  tags: string[];
}

export interface TokenBinding<T = object> {
  type: "token";
  token: Token<T>;
  target: Constructor<T> | ((container: IContainer) => T);
  scope: Scope;
  tags: string[];
}

export type Binding<T = object> =
  | ClassBinding<T>
  | ValueBinding<T>
  | FactoryBinding<T>
  | TokenBinding<T>;

// Resolution context for circular dependency detection
export interface ResolutionContext {
  path: Set<Identifier>;
  depth: number;
  maxDepth: number;
}

// Container interface
export interface IContainer {
  // Registration methods
  register<T>(
    identifier: Identifier<T>,
    binding: Partial<Binding<T>>
  ): IContainer;
  registerClass<T>(
    target: Constructor<T>,
    options?: RegistrationOptions
  ): IContainer;
  registerValue<T>(
    identifier: Identifier<T>,
    value: T,
    options?: RegistrationOptions
  ): IContainer;
  registerFactory<T>(
    identifier: Identifier<T>,
    factory: (container: IContainer) => T,
    options?: RegistrationOptions
  ): IContainer;
  registerToken<T>(
    token: Token<T>,
    target: Constructor<T> | ((container: IContainer) => T),
    options?: RegistrationOptions
  ): IContainer;

  // Resolution methods
  resolve<T>(identifier: Identifier<T>): T;
  resolveAll<T>(identifier: Identifier<T>): T[];
  tryResolve<T>(identifier: Identifier<T>): T | undefined;

  // Introspection
  isRegistered<T>(identifier: Identifier<T>): boolean;
  getBinding<T>(identifier: Identifier<T>): Binding<T> | undefined;

  // Container hierarchy
  createChild(): IContainer;
  parent?: IContainer;

  // Lifecycle
  dispose(): Promise<void>;

  // Tagged resolution
  resolveByTag<T>(tag: string): T[];
}

// Dependency injection errors
export class DependencyInjectionError extends Error {
  constructor(
    message: string,
    public readonly identifier?: Identifier,
    public readonly context?: ResolutionContext
  ) {
    super(message);
    this.name = "DependencyInjectionError";
  }
}

export class CircularDependencyError extends DependencyInjectionError {
  constructor(identifier: Identifier, context: ResolutionContext) {
    const identifierName = getIdentifierName(identifier);
    const pathNames = [...context.path].map(getIdentifierName);
    const path = pathNames.join(" -> ");

    super(
      `Circular dependency detected: ${path} -> ${identifierName}`,
      identifier,
      context
    );
    this.name = "CircularDependencyError";
  }
}

export class UnregisteredDependencyError extends DependencyInjectionError {
  constructor(identifier: Identifier) {
    const name = getIdentifierName(identifier);

    super(`No registration found for identifier: ${name}`, identifier);
    this.name = "UnregisteredDependencyError";
  }
}

// Helper function to get identifier name
export function getIdentifierName(identifier: Identifier): string {
  if (typeof identifier === "string") {
    return identifier;
  }
  if (typeof identifier === "symbol") {
    return identifier.toString();
  }
  return identifier.name || "anonymous";
}

// Helper to create tokens
export function createToken<T>(description?: string): Token<T> {
  return Symbol(description) as Token<T>;
}

export interface PropertyDep {
  property: string | symbol;
  token: Identifier;
  lazy?: boolean;
}
