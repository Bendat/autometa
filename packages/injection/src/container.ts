/**
 * Core container implementation for dependency injection
 */

import {
  IContainer,
  Identifier,
  Constructor,
  Token,
  Binding,
  ClassBinding,
  ValueBinding,
  FactoryBinding,
  TokenBinding,
  Scope,
  RegistrationOptions,
  ResolutionContext,
  CircularDependencyError,
  UnregisteredDependencyError,
} from "./types";

export class Container implements IContainer {
  private readonly bindings = new Map<Identifier, Binding>();
  private readonly instances = new Map<Identifier, unknown>();
  private readonly scopedInstances = new Map<
    string,
    Map<Identifier, unknown>
  >();
  private readonly children = new Set<Container>();
  declare public readonly parent?: IContainer;

  constructor(parent?: IContainer) {
    if (parent !== undefined) {
      this.parent = parent;
    }
  }

  // Registration methods
  register<T>(
    identifier: Identifier<T>,
    binding: Partial<Binding<T>>
  ): IContainer {
    const fullBinding: Binding<T> = {
      scope: Scope.TRANSIENT,
      tags: [],
      ...binding,
    } as Binding<T>;

    this.bindings.set(identifier as Identifier, fullBinding as Binding);
    return this;
  }

  registerClass<T>(
    target: Constructor<T>,
    options: RegistrationOptions = {}
  ): IContainer {
    const binding: ClassBinding<T> = {
      type: "class",
      target,
      scope: options.scope || Scope.TRANSIENT,
      tags: options.tags || [],
      deps: options.deps || [],
    };

    this.bindings.set(target as Identifier, binding as Binding);
    return this;
  }

  registerValue<T>(
    identifier: Identifier<T>,
    value: T,
    options: RegistrationOptions = {}
  ): IContainer {
    const binding: ValueBinding<T> = {
      type: "value",
      value,
      scope: options.scope || Scope.SINGLETON,
      tags: options.tags || [],
    };

    this.bindings.set(identifier as Identifier, binding as Binding);
    return this;
  }

  registerFactory<T>(
    identifier: Identifier<T>,
    factory: (container: IContainer) => T,
    options: RegistrationOptions = {}
  ): IContainer {
    const binding: FactoryBinding<T> = {
      type: "factory",
      factory,
      scope: options.scope || Scope.TRANSIENT,
      tags: options.tags || [],
    };

    this.bindings.set(identifier as Identifier, binding as Binding);
    return this;
  }

  registerToken<T>(
    token: Token<T>,
    target: Constructor<T> | ((container: IContainer) => T),
    options: RegistrationOptions = {}
  ): IContainer {
    const binding: TokenBinding<T> = {
      type: "token",
      token,
      target,
      scope: options.scope || Scope.TRANSIENT,
      tags: options.tags || [],
    };

    this.bindings.set(token as Identifier, binding as Binding);
    return this;
  }

  // Resolution methods
  resolve<T>(identifier: Identifier<T>): T {
    const context: ResolutionContext = {
      path: new Set(),
      depth: 0,
      maxDepth: 50,
    };

    return this.resolveWithContext(identifier as Identifier, context) as T;
  }

  resolveAll<T>(identifier: Identifier<T>): T[] {
    const results: T[] = [];

    // Collect from this container
    for (const [key, binding] of this.bindings.entries()) {
      if (
        this.identifierMatches(key, identifier as Identifier) ||
        this.bindingHasMatchingTag(binding, identifier as Identifier)
      ) {
        try {
          const instance = this.resolve(key as Identifier<T>);
          results.push(instance);
        } catch {
          // Skip failed resolutions
        }
      }
    }

    // Collect from parent
    if (this.parent) {
      results.push(...this.parent.resolveAll(identifier));
    }

    return results;
  }

  tryResolve<T>(identifier: Identifier<T>): T | undefined {
    try {
      return this.resolve(identifier);
    } catch {
      return undefined;
    }
  }

  // Introspection
  isRegistered<T>(identifier: Identifier<T>): boolean {
    return (
      this.bindings.has(identifier as Identifier) ||
      (this.parent?.isRegistered(identifier) ?? false)
    );
  }

  getBinding<T>(identifier: Identifier<T>): Binding<T> | undefined {
    const binding = this.bindings.get(identifier as Identifier) as
      | Binding<T>
      | undefined;
    return binding || this.parent?.getBinding(identifier);
  }

  // Container hierarchy
  createChild(): IContainer {
    const child = new Container(this);
    this.children.add(child);
    return child;
  }

  // Tagged resolution
  resolveByTag<T>(tag: string): T[] {
    const results: T[] = [];

    for (const [identifier, binding] of this.bindings.entries()) {
      if (binding.tags.includes(tag)) {
        try {
          const instance = this.resolve(identifier as Identifier<T>);
          results.push(instance);
        } catch {
          // Skip failed resolutions
        }
      }
    }

    if (this.parent) {
      results.push(...this.parent.resolveByTag<T>(tag));
    }

    return results;
  }

  // Lifecycle
  async dispose(): Promise<void> {
    // Dispose children first
    await Promise.all([...this.children].map((child) => child.dispose()));
    this.children.clear();

    // Dispose instances that implement disposal
    for (const instance of this.instances.values()) {
      if (instance && typeof instance === "object" && "dispose" in instance) {
        const disposable = instance as { dispose(): Promise<void> | void };
        await disposable.dispose();
      }
    }

    // Clear all caches
    this.instances.clear();
    this.scopedInstances.clear();
    this.bindings.clear();
  }

  // Private resolution implementation
  private resolveWithContext<T>(
    identifier: Identifier,
    context: ResolutionContext
  ): T {
    // Check for circular dependencies
    if (context.path.has(identifier)) {
      throw new CircularDependencyError(identifier, context);
    }

    if (context.depth >= context.maxDepth) {
      throw new Error(
        `Maximum resolution depth exceeded (${context.maxDepth})`
      );
    }

    // Get binding first to check scope
    const binding = this.getBindingInternal(identifier);
    if (!binding) {
      throw new UnregisteredDependencyError(identifier);
    }

    // Check for cached instances based on scope
    if (binding.scope === Scope.SINGLETON && this.instances.has(identifier)) {
      return this.instances.get(identifier) as T;
    }

    // Check scoped cache for other scopes
    const scopedCache = this.getScopedCache(binding.scope);
    if (scopedCache?.has(identifier)) {
      return scopedCache.get(identifier) as T;
    }

    // Add to resolution path
    context.path.add(identifier);
    context.depth++;

    try {
      // Create instance
      const instance = this.createInstance(binding, context) as T;

      // Cache based on scope
      if (binding.scope === Scope.SINGLETON) {
        this.instances.set(identifier, instance);
      } else if (scopedCache) {
        scopedCache.set(identifier, instance);
      }

      return instance;
    } finally {
      // Clean up resolution path
      context.path.delete(identifier);
      context.depth--;
    }
  }

  private getBindingInternal<T>(
    identifier: Identifier<T>
  ): Binding<T> | undefined {
    const binding = this.bindings.get(identifier as Identifier);
    return (binding ||
      (this.parent as Container)?.getBindingInternal?.(identifier)) as
      | Binding<T>
      | undefined;
  }

  private createInstance<T>(
    binding: Binding<T>,
    context: ResolutionContext
  ): T {
    switch (binding.type) {
      case "value":
        return binding.value;

      case "factory": {
        // Create a context-aware container for factories
        const contextAwareContainer = this.createContextAwareContainer(context);
        return binding.factory(contextAwareContainer);
      }

      case "class":
        return this.instantiateClass(
          binding.target as unknown as Constructor<T & object>,
          context
        ) as T;

      case "token": {
        if (typeof binding.target === "function") {
          if (this.isConstructor(binding.target)) {
            return this.instantiateClass(
              binding.target as Constructor<T & object>,
              context
            );
          } else {
            // Create a context-aware container for token factories
            const contextAwareContainer =
              this.createContextAwareContainer(context);
            return (binding.target as (container: IContainer) => T)(
              contextAwareContainer
            );
          }
        }
        throw new Error(
          `Invalid token binding target for ${binding.token.toString()}`
        );
      }

      default:
        throw new Error(`Unknown binding type: ${(binding as Binding).type}`);
    }
  }

  private instantiateClass<T extends object>(
    constructor: Constructor<T>,
    context: ResolutionContext
  ): T {
    const binding = this.getBindingInternal(constructor) as ClassBinding<T>;
    if (!binding || binding.type !== "class") {
      throw new Error(
        `No class binding found for constructor: ${constructor.name}`
      );
    }

    // Resolve constructor dependencies from the 'deps' array
    const constructorArgs = (binding.deps || []).map((dep) => {
      return this.resolveWithContext(dep, context);
    });

    // Create the instance
    const instance = new constructor(...constructorArgs);

    // Resolve and set property dependencies from the 'props' array
    if (binding.props) {
      const container = this;
      for (const prop of binding.props) {
        if (prop.lazy) {
          Object.defineProperty(instance, prop.property, {
            configurable: true,
            enumerable: true,
            get() {
              const resolved = container.resolve(prop.token);
              Object.defineProperty(instance, prop.property, {
                configurable: true,
                enumerable: true,
                writable: true,
                value: resolved,
              });
              return resolved;
            },
          });
          continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (instance as any)[prop.property] = this.resolveWithContext(
          prop.token,
          context
        );
      }
    }

    return instance;
  }

  private isConstructor(fn: unknown): fn is Constructor {
    return typeof fn === "function" && fn.prototype !== undefined;
  }

  private createContextAwareContainer(context: ResolutionContext): IContainer {
    return {
      register: <T>(identifier: Identifier<T>, binding: Partial<Binding<T>>) =>
        this.register(identifier, binding),
      registerClass: <T>(
        target: Constructor<T>,
        options?: RegistrationOptions
      ) => this.registerClass(target, options),
      registerValue: <T>(
        identifier: Identifier<T>,
        value: T,
        options?: RegistrationOptions
      ) => this.registerValue(identifier, value, options),
      registerFactory: <T>(
        identifier: Identifier<T>,
        factory: (container: IContainer) => T,
        options?: RegistrationOptions
      ) => this.registerFactory(identifier, factory, options),
      registerToken: <T>(
        token: Token<T>,
        target: Constructor<T> | ((container: IContainer) => T),
        options?: RegistrationOptions
      ) => this.registerToken(token, target, options),

      resolve: <T>(identifier: Identifier<T>): T => {
        return this.resolveWithContext(identifier as Identifier, context) as T;
      },

      resolveAll: <T>(identifier: Identifier<T>) => this.resolveAll(identifier),
      tryResolve: <T>(identifier: Identifier<T>) => this.tryResolve(identifier),
      isRegistered: <T>(identifier: Identifier<T>) =>
        this.isRegistered(identifier),
      getBinding: <T>(identifier: Identifier<T>) => this.getBinding(identifier),
      createChild: () => this.createChild(),
      resolveByTag: <T>(tag: string) => this.resolveByTag<T>(tag),
      dispose: () => this.dispose(),
    };
  }

  private getScopedCache(scope: Scope): Map<Identifier, unknown> | undefined {
    if (scope === Scope.SINGLETON || scope === Scope.TRANSIENT) {
      return undefined; // Singletons use global cache, transients are never cached
    }

    if (!this.scopedInstances.has(scope)) {
      this.scopedInstances.set(scope, new Map());
    }

    return this.scopedInstances.get(scope);
  }

  private identifierMatches(a: Identifier, b: Identifier): boolean {
    return a === b;
  }

  private bindingHasMatchingTag(
    binding: Binding,
    identifier: Identifier
  ): boolean {
    if (typeof identifier !== "string") {
      return false;
    }
    return binding.tags.includes(identifier);
  }
}

// Export convenience functions
export function createContainer(): IContainer {
  return new Container();
}

export function createChildContainer(parent: IContainer): IContainer {
  return parent.createChild();
}