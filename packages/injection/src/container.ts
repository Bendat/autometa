import { Class } from "@autometa/types";
import {
  getContainerContexts,
  getScope,
  getSingleton,
  getTypeToken,
  hasContainerContext,
  hasScope,
  hasSingleton,
  registerContainerContext,
  registerScope,
  registerSingleton,
  registerTypeToken,
} from "./metadata-registry";
import { metadata } from "./metadata";
import { INJECTION_SCOPE } from "./scope.enum";
import { DisposeMethod, InjectionToken, Token } from "./token";
import { InjectorKey } from "./types";
import { AutometaSymbol } from "./symbol";

export class Container {
  #disposables = new Set<{ [DisposeMethod](): unknown }>();
  #globalDisposables = new Set<{ [DisposeMethod](): unknown }>();
  constructor(readonly reference: symbol) {}

  registerSingleton<T>(token: InjectionToken, type: Class<T>): Container;
  registerSingleton<T>(type: Class<T>): Container;
  registerSingleton<T>(token: Class<T> | InjectionToken, type?: Class<T>) {
    registerScope(token, INJECTION_SCOPE.SINGLETON);
    if (token instanceof InjectionToken && type) {
      registerTypeToken(token, type);
    }
    return this;
  }

  registerCached<T>(token: InjectionToken, type: Class<T>): Container;
  registerCached<T>(type: Class<T>): Container;
  registerCached<T>(token: Class<T> | InjectionToken, type?: Class<T>) {
    registerScope(token, INJECTION_SCOPE.CACHED);
    if (token instanceof InjectionToken && type) {
      registerTypeToken(token, type);
    }
    return this;
  }

  registerTransient<T>(target: Class<T>): Container;
  registerTransient<T>(token: InjectionToken, target: Class<T>): Container;
  registerTransient(
    target: Class<unknown> | InjectionToken,
    type?: Class<unknown>
  ) {
    this.#throwOnSingletonTokenClash(target);
    registerScope(target, INJECTION_SCOPE.TRANSIENT);
    if (target instanceof InjectionToken && type) {
      registerTypeToken(target, type);
    }
    return this;
  }

  registerSingletonValue(identifier: string, value: unknown) {
    registerSingleton(Token(identifier), value);
    return this;
  }

  registerCachedValue(identifier: string, value: unknown) {
    this.#throwOnSingletonTokenClash(Token(identifier));
    registerScope(Token(identifier), INJECTION_SCOPE.CACHED);
    registerContainerContext(this.reference, Token(identifier), value);
    return this;
  }

  #throwOnSingletonTokenClash(token: InjectorKey) {
    if (hasSingleton(token)) {
      throw new Error(
        `Singleton token ${token.name} is already registered. Use a different token or register a cached dependency`
      );
    }
  }
  get<T>(token: string): T;
  get<T>(token: InjectionToken): T;
  get<T>(target: Class<T>): T;
  get<T>(target: InjectorKey | string): T;
  get<T>(target: InjectorKey | string): T {
    target = getRealTarget(target);

    if (hasSingleton(target)) {
      return getSingleton(target) as T;
    }
    const scope = getScope(target);
    if (!hasScope(target)) {
      registerScope(target, INJECTION_SCOPE.CACHED);
    }
    const type = getTypeToken(target) ?? (target as Class<unknown>);
    if (scope === INJECTION_SCOPE.SINGLETON) {
      const instance = this.#assembleTarget(type);
      registerSingleton(target, instance);
      return instance as T;
    }

    if (scope === INJECTION_SCOPE.CACHED) {
      if (hasContainerContext(this.reference, target)) {
        return getContainerContexts(this.reference, target) as T;
      }
      const assembled = this.#assembleTarget(type);
      return registerContainerContext(this.reference, target, assembled) as T;
    }

    return this.#assembleTarget(type) as T;
  }

  async disposeAll() {
    for (const disposable of this.#disposables) {
      await disposable[DisposeMethod]();
    }
  }

  async disposeGlobal() {
    for (const disposable of this.#globalDisposables) {
      await disposable[DisposeMethod]();
    }
  }
  
  #assembleTarget<T>(target: Class<T>): T {
    const constructor = this.#getConstructorArgs<T>(target);
    const args = constructor.map((arg) => this.get(arg));
    const instance = new target(...args) as Record<string, unknown>;
    const meta = metadata(target);
    const keys = meta.keys as string[];
    for (const key of keys) {
      const info = meta.get(key);
      if (!info) {
        throw new Error(
          `No metadata found for ${key} in ${target.name}. Did you forget to decorate it? 
Use the \`@Inject.class\`, \`@Inject.factory\` or \`@Inject.value\` decorator to register a dependency type or value`
        );
      }
      if (info && "class" in info) {
        const dependency = this.get(info.class);
        instance[key] = dependency;
      }

      if (info && "factory" in info) {
        const dependency = info.factory();
        instance[key] = dependency;
      }

      if (info && "value" in info) {
        const dependency = info.value;
        instance[key] = dependency;
      }
    }
    if (
      DisposeMethod in instance &&
      typeof instance[DisposeMethod] === "function"
    ) {
      this.#disposables.add(instance as { [DisposeMethod](): unknown });
    }
    return instance as T;
  }

  #getConstructorArgs<T>(target: Class<T>) {
    return (
      metadata(target).getCustom<InjectorKey[]>(AutometaSymbol.CONSTRUCTOR) ??
      []
    );
  }
}

function getRealTarget(target: Class<unknown> | InjectionToken | string) {
  if (typeof target === "string") {
    return Token(target);
  }
  if (target instanceof InjectionToken) {
    return target;
  }
  return target;
}
