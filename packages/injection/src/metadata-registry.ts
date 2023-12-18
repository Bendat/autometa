import { Class } from "@autometa/types";
import { InjectionScope } from "./scope.enum";
import { InjectorKey } from "./types";
import { InjectionToken } from "./token";

const ScopeRegistry = new Map<InjectorKey, InjectionScope>();
const TokenTypeRegistry = new Map<InjectionToken, Class<unknown>>();
const SingletonRegistry = new Map<InjectorKey, unknown>();
const ContainerContextRegistry = new Map<symbol, Map<InjectorKey, unknown>>();

export function registerSingleton<T extends InjectorKey>(
  target: T,
  instance: unknown
) {
  if (SingletonRegistry.has(target)) {
    throw new Error(`Singleton already registered for ${target.name}`);
  }
  SingletonRegistry.set(target, instance);
}
export function getSingleton<T extends InjectorKey>(
  target: T
): unknown | undefined {
  return SingletonRegistry.get(target);
}

export function hasSingleton<T extends InjectorKey>(
  target: T
): boolean | undefined {
  return SingletonRegistry.has(target);
}

export function registerScope<T extends InjectorKey>(
  target: T,
  scope: InjectionScope
) {
  ScopeRegistry.set(target, scope);
}

export function getScope<T extends InjectorKey>(
  target: T
): InjectionScope | undefined {
  return ScopeRegistry.get(target);
}

export function hasScope<T extends InjectorKey>(
  target: T
): boolean | undefined {
  return ScopeRegistry.has(target);
}

export function registerContainerContext<T extends InjectorKey>(
  context: symbol,
  target: T,
  instance: unknown
) {
  if (!ContainerContextRegistry.has(context)) {
    ContainerContextRegistry.set(context, new Map());
  }
  ContainerContextRegistry.get(context)?.set(target, instance);
  return instance;
}

export function getContainerContexts<T extends InjectorKey>(
  context: symbol,
  target: T
): unknown | undefined {
  if (!ContainerContextRegistry.has(context)) {
    ContainerContextRegistry.set(context, new Map());
  }
  return ContainerContextRegistry.get(context)?.get(target);
}

export function hasContainerContext<T extends InjectorKey>(
  context: symbol,
  target: T
): boolean {
  if (!ContainerContextRegistry.has(context)) {
    ContainerContextRegistry.set(context, new Map());
  }
  return ContainerContextRegistry.get(context)?.has(target) ?? false;
}
export function registerTypeToken<T>(token: InjectionToken, target: Class<T>) {
  TokenTypeRegistry.set(token, target);
}

export function getTypeToken<T>(token: InjectionToken): Class<T> | undefined {
  return TokenTypeRegistry.get(token) as Class<T>;
}

export function hasToken(token: InjectionToken): boolean {
  return TokenTypeRegistry.has(token);
}
export function clearRegistries() {
  ScopeRegistry.clear();
  SingletonRegistry.clear();
  ContainerContextRegistry.clear();
  TokenTypeRegistry.clear();
}
