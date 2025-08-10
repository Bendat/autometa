export type DefaultSupplier<T> = () => T;

export type DefaultsRecord<T> = Partial<{
  [K in keyof T]: DefaultSupplier<T[K]>;
}>;

export type DefaultDefinition<T> = T | DefaultSupplier<T>;

export type DefaultsInput<T> = Partial<{
  [K in keyof T]: DefaultDefinition<T[K]>;
}>;

export type Validator<T> = (value: T) => void | Promise<void>;

export interface BuildOptions {
  skipValidation?: boolean;
}

export type MaybePromise<T> = T | Promise<T>;

export interface InterfaceBuilderOptions<T> {
  defaults?: DefaultsInput<T>;
  validator?: Validator<T>;
}

export type ClassBuilderOptions<T> = InterfaceBuilderOptions<T>;

export type ClassConstructor<T> = new (...args: unknown[]) => T;

export type ArrayElement<T> = T extends Array<infer U> ? U : never;

export type ArrayKeys<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends Array<unknown> ? K : never;
}[keyof T];

export type ObjectKeys<T> = {
  [K in keyof T]-?: IsPlainObjectType<NonNullable<T[K]>> extends true ? K : never;
}[keyof T];

type IsPlainObjectType<T> = T extends object
  ? T extends Array<unknown>
    ? false
    : T extends (...args: never[]) => unknown
    ? false
    : true
  : false;

export interface ArrayEditor<T> {
  append(value: T): ArrayEditor<T>;
  prepend(value: T): ArrayEditor<T>;
  insert(index: number, value: T): ArrayEditor<T>;
  set(index: number, value: T): ArrayEditor<T>;
  update(index: number, updater: (value: T) => T): ArrayEditor<T>;
  remove(predicate: (value: T, index: number, array: T[]) => boolean): ArrayEditor<T>;
  replace(values: T[]): ArrayEditor<T>;
  clear(): ArrayEditor<T>;
  map(mapper: (value: T, index: number, array: T[]) => T): ArrayEditor<T>;
  sort(compareFn?: (a: T, b: T) => number): ArrayEditor<T>;
  toArray(): T[];
}

export type ArrayEditorCallback<T> = (editor: ArrayEditor<T>) => void;

export type NestedBuilderCallback<T> = (builder: BuilderInstance<T>) => BuilderInstance<T> | void;

type ObjectCallbackParam<T, K extends keyof T> = IsPlainObjectType<NonNullable<T[K]>> extends true
  ? NestedBuilderCallback<NonNullable<T[K]>>
  : never;

type ArrayCallbackParam<T, K extends keyof T> = NonNullable<T[K]> extends Array<infer Element>
  ? ArrayEditorCallback<Element>
  : never;

type CallbackSetterOverloads<T, K extends keyof T> = (ArrayCallbackParam<T, K> extends never
  ? {}
  : (configure: ArrayCallbackParam<T, K>) => BuilderInstance<T>) &
  (ObjectCallbackParam<T, K> extends never
    ? {}
    : (configure: ObjectCallbackParam<T, K>) => BuilderInstance<T>);

type FluentSetter<T, K extends keyof T> = ((value: T[K]) => BuilderInstance<T>) &
  CallbackSetterOverloads<T, K>;

export interface BaseBuilderInstance<T, Self> {
  set<K extends keyof T>(key: K, value: T[K]): Self;
  update<K extends keyof T>(key: K, updater: (value: T[K] | undefined) => T[K]): Self;
  append<K extends ArrayKeys<T>>(key: K, value: ArrayElement<T[K]>): Self;
  append(key: string, value: unknown): Self;
  merge<K extends ObjectKeys<T>>(key: K, value: Partial<T[K]>): Self;
  assign<K extends keyof T>(key: K, value: T[K]): Self;
  assign(key: string, value: unknown): Self;
  attach<K extends keyof T>(key: K, subProperty: string, value: unknown): Self;
  attach(key: string, subProperty: string, value: unknown): Self;
  get<K extends keyof T>(key: K): T[K] | undefined;
  derive(): Self;
  build(options?: BuildOptions): MaybePromise<T>;
}

export type FluentProperty<T, K extends keyof T> = FluentSetter<T, K> &
  (() => T[K]) & { readonly value: T[K] | undefined };

export type BuilderInstance<T> = BaseBuilderInstance<T, BuilderInstance<T>> & {
  [K in keyof T]-?: FluentProperty<T, K>;
};

export interface BuilderFactory<T> {
  create(initial?: Partial<T>): BuilderInstance<T>;
  fromRaw(raw: Partial<T>): BuilderInstance<T>;
  default(options?: BuildOptions): MaybePromise<T>;
}
