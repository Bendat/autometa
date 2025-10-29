import {
  ArrayEditor,
  ArrayElement,
  ArrayKeys,
  BaseBuilderInstance,
  BuildOptions,
  BuilderFactory,
  BuilderInstance,
  DefaultsRecord,
  FluentProperty,
  MaybePromise,
  ObjectKeys,
  Validator,
} from "./types";
import { cloneValue, deepMerge, isPlainObject, isPromiseLike } from "./utils";

interface BuilderConfig<T> {
  createTarget(): T;
  defaults: DefaultsRecord<T>;
  validator?: Validator<T>;
}

class BuilderImpl<T> implements BaseBuilderInstance<T, BuilderImpl<T>> {
  private state: Record<PropertyKey, unknown>;
  constructor(private readonly config: BuilderConfig<T>, initial?: Record<PropertyKey, unknown>) {
    this.state = initial ? cloneValue(initial) : {};
  }

  set<K extends keyof T>(key: K, value: T[K]): this {
    this.assignState(key, value);
    return this;
  }

  update<K extends keyof T>(key: K, updater: (value: T[K] | undefined) => T[K]): this {
    const current = this.get(key);
    const next = updater(cloneValue(current));
    this.assignState(key, next);
    return this;
  }

  append<K extends ArrayKeys<T>>(key: K, value: ArrayElement<T[K]>): this;
  append(key: string, value: unknown): this;
  append(key: string, value: unknown): this {
    const current = this.readValue(key);
    const next = Array.isArray(current) ? [...current, cloneValue(value)] : [cloneValue(value)];
    this.assignState(key, next);
    return this;
  }

  merge<K extends ObjectKeys<T>>(key: K, value: Partial<T[K]>): this {
    const current = this.get(key);
    const base = isPlainObject(current) ? cloneValue(current) : {};
    const merged = deepMerge(base as Record<string, unknown>, value as Record<string, unknown>);
    this.assignState(key, merged as T[K]);
    return this;
  }

  assign<K extends keyof T>(key: K, value: T[K]): this;
  assign(key: string, value: unknown): this;
  assign(key: string, value: unknown): this {
    this.assignState(key, value);
    return this;
  }

  attach<K extends keyof T>(key: K, subProperty: string, value: unknown): this;
  attach(key: string, subProperty: string, value: unknown): this;
  attach(key: string, subProperty: string, value: unknown): this {
    const current = this.readValue(key);
    const base = isPlainObject(current) ? (cloneValue(current) as Record<string, unknown>) : {};
    base[subProperty] = cloneValue(value);
    this.assignState(key, base);
    return this;
  }

  get<K extends keyof T>(key: K): T[K] | undefined {
    return this.readValue(String(key)) as T[K] | undefined;
  }

  derive(): BuilderImpl<T> {
    return new BuilderImpl<T>(this.config, cloneValue(this.state));
  }

  applyCallback<K extends keyof T>(key: K, callback: (arg: unknown) => unknown): this {
    const context = new FluentCallbackContext<T, K>(this, key);
    context.run(callback);
    return this;
  }

  build(options?: BuildOptions): MaybePromise<T> {
    const target = cloneValue(this.config.createTarget());
    const defaults = this.createDefaultsSnapshot();
    const merged = deepMerge(target as Record<string, unknown>, defaults as Record<string, unknown>);
    const final = deepMerge(merged, this.state as Record<string, unknown>);
    if (!options?.skipValidation && this.config.validator) {
      const validationResult = this.config.validator(final as T);
      if (isPromiseLike(validationResult)) {
        return validationResult.then(() => final as T);
      }
    }
    return final as T;
  }

  private assignState(key: PropertyKey, value: unknown): void {
    this.state = { ...this.state, [key]: cloneValue(value) };
  }

  private createDefaultsSnapshot(): Partial<T> {
    const snapshot: Partial<T> = {};
    for (const key of Object.keys(this.config.defaults) as Array<keyof T>) {
      const supplier = this.config.defaults[key];
      if (supplier) {
        snapshot[key] = cloneValue(supplier());
      }
    }
    return snapshot;
  }

  private readValue(key: string): unknown {
    if (Object.prototype.hasOwnProperty.call(this.state, key)) {
      return cloneValue(this.state[key]);
    }
    const supplier = this.config.defaults[key as keyof T];
    if (supplier) {
      return cloneValue(supplier());
    }
    return undefined;
  }

}

export function createBuilderFactory<T>(config: BuilderConfig<T>): BuilderFactory<T> {
  return {
    create(initial?: Partial<T>): BuilderInstance<T> {
      const snapshot = initial ? (cloneValue(initial) as Record<PropertyKey, unknown>) : undefined;
      const state = new BuilderImpl<T>(config, snapshot);
      return createFluentProxy(state);
    },
    fromRaw(raw: Partial<T>): BuilderInstance<T> {
      const snapshot = cloneValue(raw) as Record<PropertyKey, unknown>;
      const state = new BuilderImpl<T>(config, snapshot);
      return createFluentProxy(state);
    },
    default(options?: BuildOptions): MaybePromise<T> {
      const builder = createFluentProxy(new BuilderImpl<T>(config));
      return builder.build(options);
    },
  };
}

export function toBuilderConfig<T>(params: {
  createTarget: () => T;
  defaults?: DefaultsRecord<T>;
  validator?: Validator<T>;
}): BuilderConfig<T> {
  const config: BuilderConfig<T> = {
    createTarget: params.createTarget,
    defaults: params.defaults ?? {},
  };

  if (params.validator) {
    config.validator = params.validator;
  }

  return config;
}

export type { BuilderConfig };

function createFluentProxy<T>(state: BuilderImpl<T>): BuilderInstance<T> {
  const cache = new Map<PropertyKey, unknown>();
  const objectPrototype = Object.prototype;
  const baseMethodNames = new Set(
    Object.getOwnPropertyNames(BuilderImpl.prototype).filter((name) => "constructor" !== name)
  );

  const handler: ProxyHandler<BuilderImpl<T>> = {
    get(target, prop, receiver) {
      if (typeof prop === "symbol") {
        return Reflect.get(target, prop, receiver);
      }

      if (Reflect.has(target, prop)) {
        const value = Reflect.get(target, prop, target);
        if ("function" === typeof value) {
          return (...args: unknown[]) => {
            const thisArg = baseMethodNames.has(String(prop)) ? target : proxy;
            const result = value.apply(thisArg, args);
            if (result === target) {
              return proxy;
            }
            if (result === proxy) {
              return proxy;
            }
            if (result instanceof BuilderImpl) {
              return createFluentProxy(result);
            }
            return result;
          };
        }
        return value;
      }

      if (Object.prototype.hasOwnProperty.call(objectPrototype, prop)) {
        return Reflect.get(objectPrototype, prop, receiver);
      }

      if (cache.has(prop)) {
        return cache.get(prop);
      }

      const key = prop as keyof T;
      const fluent = ((...args: unknown[]) => {
        if (0 === args.length) {
          return state.get(key);
        }
        const [value] = args;
        if ("function" === typeof value) {
          state.applyCallback(key, value as (arg: unknown) => unknown);
          return proxy;
        }
        state.set(key, value as T[typeof key]);
        return proxy;
      }) as FluentProperty<T, typeof key>;

      Object.defineProperty(fluent, "value", {
        get() {
          return state.get(key);
        },
      });

      cache.set(prop, fluent);
      return fluent;
    },
    set(target, prop, value, receiver) {
      cache.delete(prop);
      return Reflect.set(target, prop, value, receiver);
    },
  };

  const proxy = new Proxy(state, handler) as unknown as BuilderInstance<T>;
  return proxy;
}

function snapshotObjectState(value: unknown): Record<PropertyKey, unknown> | undefined {
  if (null == value || "object" !== typeof value) {
    return undefined;
  }
  if (isPlainObject(value)) {
    return cloneValue(value as Record<PropertyKey, unknown>);
  }
  const result: Record<PropertyKey, unknown> = {};
  for (const key of Reflect.ownKeys(value as object)) {
    const descriptor = Object.getOwnPropertyDescriptor(value as object, key);
    if (descriptor && descriptor.enumerable) {
      result[key] = cloneValue((value as Record<PropertyKey, unknown>)[key]);
    }
  }
  return result;
}

type PropertyKind = "array" | "object" | "unknown";

const ARRAY_EDITOR_METHODS: ReadonlySet<PropertyKey> = new Set([
  "append",
  "prepend",
  "insert",
  "set",
  "update",
  "remove",
  "replace",
  "clear",
  "map",
  "sort",
  "toArray",
]);

class ArrayEditorImpl<T> implements ArrayEditor<T> {
  private items: T[];

  constructor(initial: T[]) {
    this.items = [...initial];
  }

  append(value: T): ArrayEditor<T> {
    this.items = [...this.items, cloneValue(value) as T];
    return this;
  }

  prepend(value: T): ArrayEditor<T> {
    this.items = [cloneValue(value) as T, ...this.items];
    return this;
  }

  insert(index: number, value: T): ArrayEditor<T> {
    const safeIndex = Math.max(0, Math.min(index, this.items.length));
    this.items = [
      ...this.items.slice(0, safeIndex),
      cloneValue(value) as T,
      ...this.items.slice(safeIndex),
    ];
    return this;
  }

  set(index: number, value: T): ArrayEditor<T> {
    this.ensureIndexWithinBounds(index);
    const copy = [...this.items];
    copy[index] = cloneValue(value) as T;
    this.items = copy;
    return this;
  }

  update(index: number, updater: (value: T) => T): ArrayEditor<T> {
    this.ensureIndexWithinBounds(index);
    const current = cloneValue(this.items[index]) as T;
    const next = cloneValue(updater(current)) as T;
    const copy = [...this.items];
    copy[index] = next;
    this.items = copy;
    return this;
  }

  remove(predicate: (value: T, index: number, array: T[]) => boolean): ArrayEditor<T> {
    this.items = this.items.filter((item, index, array) => !predicate(cloneValue(item) as T, index, array));
    return this;
  }

  replace(values: T[]): ArrayEditor<T> {
    this.items = values.map((value) => cloneValue(value) as T);
    return this;
  }

  clear(): ArrayEditor<T> {
    this.items = [];
    return this;
  }

  map(mapper: (value: T, index: number, array: T[]) => T): ArrayEditor<T> {
    this.items = this.items.map((item, index, array) => cloneValue(mapper(cloneValue(item) as T, index, array)) as T);
    return this;
  }

  sort(compareFn?: (a: T, b: T) => number): ArrayEditor<T> {
    const copy = [...this.items];
    if (compareFn) {
      copy.sort((a, b) => compareFn(cloneValue(a) as T, cloneValue(b) as T));
    } else {
      copy.sort();
    }
    this.items = copy.map((value) => cloneValue(value) as T);
    return this;
  }

  toArray(): T[] {
    return this.items.map((item) => cloneValue(item) as T);
  }

  snapshot(): T[] {
    return [...this.items];
  }

  private ensureIndexWithinBounds(index: number): void {
    if (index < 0 || index >= this.items.length) {
      throw new RangeError(`Index ${index} is out of bounds for array of length ${this.items.length}.`);
    }
  }
}

class FluentCallbackContext<T, K extends keyof T> {
  private mode: "array" | "object" | undefined;
  private resolvedKind: PropertyKind;
  private arrayEditor?: ArrayEditorImpl<ArrayElement<NonNullable<T[K]>>>;
  private objectBuilder?: BuilderInstance<NonNullable<T[K]>>;

  constructor(private readonly parent: BuilderImpl<T>, private readonly key: K) {
    this.resolvedKind = this.detectInitialKind();
  }

  run(callback: (arg: unknown) => unknown): void {
    const proxy = this.createProxy();
    const result = callback(proxy);
    if (this.mode === "object" && this.isBuilderInstance(result)) {
      this.objectBuilder = result as BuilderInstance<NonNullable<T[K]>>;
    }
    this.commit();
  }

  private createProxy(): unknown {
    return new Proxy(
      {},
      {
  get: (_, prop, _receiver) => {
          if (typeof prop === "symbol") {
            if (prop === Symbol.toStringTag) {
              return "FluentCallbackContext";
            }
            return undefined;
          }

          const prefersArray = this.mode !== "object" && this.resolvedKind !== "object";

          if (ARRAY_EDITOR_METHODS.has(prop) && prefersArray) {
            this.ensureArrayMode();
            const editor = this.arrayEditor as unknown as Record<PropertyKey, unknown>;
            const value = editor[prop];
            if (typeof value === "function") {
              return value.bind(editor);
            }
            return value;
          }

          this.ensureObjectMode();
          const builder = this.objectBuilder as unknown as Record<PropertyKey, unknown>;
          const value = builder[prop];
          if (typeof value === "function") {
            return value.bind(builder);
          }
          return value;
        },
      }
    );
  }

  private ensureArrayMode(): void {
    if (this.mode === "object") {
      throw new TypeError("Cannot use array helpers after object helpers within the same callback.");
    }
    if (!this.arrayEditor) {
      if ("object" === this.resolvedKind) {
        throw new TypeError(
          `Property "${String(this.key)}" does not support array-style callback operations.`
        );
      }
      const current = this.parent.get(this.key);
      const initial = Array.isArray(current)
        ? (cloneValue(current) as Array<ArrayElement<NonNullable<T[K]>>>)
        : [];
      this.arrayEditor = new ArrayEditorImpl<ArrayElement<NonNullable<T[K]>>>(initial);
      this.resolvedKind = "array";
    }
    this.mode = "array";
  }

  private ensureObjectMode(): void {
    if (this.mode === "array") {
      throw new TypeError("Cannot use object helpers after array helpers within the same callback.");
    }
    if (!this.objectBuilder) {
      if ("array" === this.resolvedKind) {
        throw new TypeError(
          `Property "${String(this.key)}" does not support object-style callback operations.`
        );
      }
      const current = this.parent.get(this.key);
      const initialState = snapshotObjectState(current);
      type ObjectValue = NonNullable<T[K]>;
      const childConfig: BuilderConfig<ObjectValue> = {
        createTarget: () => ({} as ObjectValue),
        defaults: {},
      };
      const childState = new BuilderImpl<ObjectValue>(childConfig, initialState);
      this.objectBuilder = createFluentProxy(childState);
      this.resolvedKind = "object";
    }
    this.mode = "object";
  }

  private commit(): void {
    if (!this.mode) {
      return;
    }

    if (this.mode === "array") {
      const snapshot = (this.arrayEditor as ArrayEditorImpl<ArrayElement<NonNullable<T[K]>>>).snapshot();
      this.parent.set(this.key, snapshot as T[K]);
      return;
    }

    const builder = this.objectBuilder as BuilderInstance<NonNullable<T[K]>>;
    const built = builder.build({ skipValidation: true });
    if (isPromiseLike(built)) {
      throw new TypeError("Async nested builder callbacks are not supported.");
    }
    this.parent.set(this.key, built as T[K]);
  }

  private detectInitialKind(): PropertyKind {
    const current = this.parent.get(this.key);
    if (Array.isArray(current)) {
      return "array";
    }
    if (isPlainObject(current)) {
      return "object";
    }
    return "unknown";
  }

  private isBuilderInstance(value: unknown): value is BuilderInstance<NonNullable<T[K]>> {
    if (!value) {
      return false;
    }
    return "function" === typeof (value as BuilderInstance<NonNullable<T[K]>>).build;
  }
}
