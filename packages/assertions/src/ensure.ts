import { EnsureError, type EnsureErrorDetails } from "./assertion-error";
import {
  type FailureDetails,
  type MatcherContext,
  type MatcherState,
} from "./core/context";
import {
  assertArrayContaining,
  assertContainEqual,
  assertHasLength,
  assertIterableContaining,
  assertObjectContaining,
} from "./matchers/collections";
import { assertToBe, assertToEqual, assertToStrictEqual } from "./matchers/equality";
import { assertToBeInstanceOf } from "./matchers/instance";
import {
  assertToBeDefined,
  assertToBeNull,
  assertToBeUndefined,
} from "./matchers/nullish";
import {
  assertToBeCloseTo,
  assertToBeGreaterThan,
  assertToBeGreaterThanOrEqual,
  assertToBeLessThan,
  assertToBeLessThanOrEqual,
} from "./matchers/numeric";
import { assertToBeTypeOf } from "./matchers/type-of";
import { assertToBeFalsy, assertToBeTruthy } from "./matchers/truthiness";

export interface EnsureOptions {
  readonly label?: string;
}

export interface EnsureEachOptions<T> {
  readonly label?: string | ((details: { readonly index: number; readonly value: T }) => string);
}

export interface EnsureTapContext<Negated extends boolean> {
  readonly isNot: Negated;
  readonly label?: string;
}

type EnsureTypeOf =
  | "string"
  | "number"
  | "boolean"
  | "bigint"
  | "symbol"
  | "undefined"
  | "object"
  | "function";

type TypeOfResult<T extends EnsureTypeOf> = T extends "string"
  ? string
  : T extends "number"
    ? number
    : T extends "boolean"
      ? boolean
      : T extends "bigint"
        ? bigint
        : T extends "symbol"
          ? symbol
          : T extends "undefined"
            ? undefined
            : T extends "function"
              ? (...args: never[]) => unknown
              : T extends "object"
                ? object | null
                : never;

type NarrowByTypeOf<T, Expected extends EnsureTypeOf> = [
  Extract<T, TypeOfResult<Expected>>,
] extends [never]
  ? TypeOfResult<Expected>
  : Extract<T, TypeOfResult<Expected>>;

type NarrowToArray<T> = [Extract<T, readonly unknown[]>] extends [never]
  ? readonly unknown[]
  : Extract<T, readonly unknown[]>;

type Toggle<Negated extends boolean> = Negated extends true ? false : true;

interface EnsureChainInternal<T, Negated extends boolean> {
  readonly value: T;
  readonly not: EnsureChainInternal<T, Toggle<Negated>>;
  tap(
    fn: (value: T, context: EnsureTapContext<Negated>) => void
  ): EnsureChainInternal<T, Negated>;
  map<U, Arr extends readonly unknown[]>(
    this: EnsureChainInternal<Arr, Negated>,
    selector: (value: Arr[number], index: number, array: Arr) => U,
    options?: EnsureOptions
  ): EnsureChainInternal<U[], Negated>;
  each<Arr extends readonly unknown[]>(
    this: EnsureChainInternal<Arr, Negated>,
    fn: (value: EnsureChainInternal<Arr[number], Negated>, index: number) => void,
    options?: EnsureEachOptions<Arr[number]>
  ): EnsureChainInternal<Arr, Negated>;
  pluck<Arr extends readonly object[], K extends keyof Arr[number]>(
    this: EnsureChainInternal<Arr, Negated>,
    key: K,
    options?: EnsureOptions
  ): EnsureChainInternal<Array<Arr[number][K]>, Negated>;
  prop<Obj extends object, K extends keyof Obj>(
    this: EnsureChainInternal<Obj, Negated>,
    key: K,
    options?: EnsureOptions
  ): EnsureChainInternal<Obj[K], Negated>;
  toBeTypeOf<Expected extends EnsureTypeOf>(
    expected: Expected
  ): EnsureChainInternal<Negated extends true ? T : NarrowByTypeOf<T, Expected>, Negated>;
  toBe(expected: T): EnsureChainInternal<T, Negated>;
  toEqual(expected: unknown): EnsureChainInternal<T, Negated>;
  toStrictEqual(expected: unknown): EnsureChainInternal<T, Negated>;
  toBeDefined(): EnsureChainInternal<Negated extends true ? T : NonNullable<T>, Negated>;
  toBeUndefined(): EnsureChainInternal<Negated extends true ? T : undefined, Negated>;
  toBeNull(): EnsureChainInternal<Negated extends true ? T : null, Negated>;
  toBeTruthy(): EnsureChainInternal<T, Negated>;
  toBeFalsy(): EnsureChainInternal<T, Negated>;
  toBeGreaterThan(expected: number): EnsureChainInternal<
    Negated extends true ? T : Extract<T, number>,
    Negated
  >;
  toBeGreaterThanOrEqual(expected: number): EnsureChainInternal<
    Negated extends true ? T : Extract<T, number>,
    Negated
  >;
  toBeLessThan(expected: number): EnsureChainInternal<
    Negated extends true ? T : Extract<T, number>,
    Negated
  >;
  toBeLessThanOrEqual(expected: number): EnsureChainInternal<
    Negated extends true ? T : Extract<T, number>,
    Negated
  >;
  toBeCloseTo(expected: number, precision?: number): EnsureChainInternal<
    Negated extends true ? T : Extract<T, number>,
    Negated
  >;
  toBeInstanceOf(
    ctor: ArrayConstructor
  ): EnsureChainInternal<Negated extends true ? T : NarrowToArray<T>, Negated>;
  toBeInstanceOf<Ctor extends abstract new (...args: never[]) => unknown>(
    ctor: Ctor
  ): EnsureChainInternal<Negated extends true ? T : InstanceType<Ctor>, Negated>;
  toBeObjectContaining<Shape extends Record<PropertyKey, unknown>>(
    shape: Shape
  ): EnsureChainInternal<T, Negated>;
  toBeArrayContaining(expected: readonly unknown[]): EnsureChainInternal<
    Negated extends true ? T : Extract<T, readonly unknown[]>,
    Negated
  >;
  toContainEqual(expected: unknown): EnsureChainInternal<
    Negated extends true ? T : Extract<T, readonly unknown[]>,
    Negated
  >;
  toBeIterableContaining(expected: readonly unknown[]): EnsureChainInternal<
    Negated extends true ? T : Extract<T, Iterable<unknown>>,
    Negated
  >;
  toHaveLength(expected: number): EnsureChainInternal<
    Negated extends true ? T : Extract<T, { length: number }> ,
    Negated
  >;
}

export type EnsureChain<T> = EnsureChainInternal<T, false>;
export type EnsureNegatedChain<T> = EnsureChainInternal<T, true>;

export function ensure<T>(value: T, options: EnsureOptions = {}): EnsureChain<T> {
  const state = {
    value,
    negated: false as const,
    ...(options.label !== undefined ? { label: options.label } : {}),
  } satisfies MatcherState<T> & { negated: false };
  return new EnsureChainImpl<T, false>(state);
}

class EnsureChainImpl<T, Negated extends boolean>
  implements EnsureChainInternal<T, Negated> {
  private readonly state: MatcherState<T> & { negated: Negated };

  constructor(state: MatcherState<T> & { negated: Negated }) {
    this.state = state;
  }

  public get value(): T {
    return this.state.value;
  }

  public get not(): EnsureChainInternal<T, Toggle<Negated>> {
    const toggled = (!this.state.negated) as Toggle<Negated>;
    const nextState = {
      value: this.state.value,
      negated: toggled,
      ...(this.state.label !== undefined ? { label: this.state.label } : {}),
    };
    return new EnsureChainImpl<T, Toggle<Negated>>(
      nextState as MatcherState<T> & { negated: Toggle<Negated> }
    );
  }

  public tap(
    fn: (value: T, context: EnsureTapContext<Negated>) => void
  ): EnsureChainInternal<T, Negated> {
    fn(this.state.value, {
      isNot: this.state.negated,
      ...(this.state.label !== undefined ? { label: this.state.label } : {}),
    });
    return this;
  }

  public map<U, Arr extends readonly unknown[]>(
    this: EnsureChainInternal<Arr, Negated>,
    selector: (value: Arr[number], index: number, array: Arr) => U,
    options: EnsureOptions = {}
  ): EnsureChainInternal<U[], Negated> {
    const chain = this as unknown as EnsureChainImpl<Arr, Negated>;
    const current = chain.state.value as unknown;
    if (!Array.isArray(current)) {
      chain.fail("map", {
        message: "Expected value to be an array in order to use ensure(...).map(...)",
        actual: chain.state.value,
        expected: "array",
      });
    }

    const values = current as unknown as Arr;
    const mapped = values.map((value, index, array) =>
      selector(value as Arr[number], index, array as Arr)
    );
    const nextState = {
      value: mapped,
      negated: chain.state.negated,
      ...(options.label !== undefined
        ? { label: options.label }
        : chain.state.label !== undefined
          ? { label: chain.state.label }
          : {}),
    };
    return new EnsureChainImpl<U[], Negated>(
      nextState as MatcherState<U[]> & { negated: Negated }
    );
  }

  public each<Arr extends readonly unknown[]>(
    this: EnsureChainInternal<Arr, Negated>,
    fn: (value: EnsureChainInternal<Arr[number], Negated>, index: number) => void,
    options: EnsureEachOptions<Arr[number]> = {}
  ): EnsureChainInternal<Arr, Negated> {
    const chain = this as unknown as EnsureChainImpl<Arr, Negated>;
    const current = chain.state.value as unknown;
    if (!Array.isArray(current)) {
      chain.fail("each", {
        message: "Expected value to be an array in order to use ensure(...).each(...)",
        actual: chain.state.value,
        expected: "array",
      });
    }

    const values = current as unknown as Arr;
    for (let index = 0; index < values.length; index += 1) {
      const element = values[index] as Arr[number];
      const elementLabel = chain.buildEachLabel(element, index, options);
      const elementState = {
        value: element,
        negated: chain.state.negated,
        ...(elementLabel !== undefined ? { label: elementLabel } : {}),
      };
      fn(
        new EnsureChainImpl<Arr[number], Negated>(
          elementState as MatcherState<Arr[number]> & { negated: Negated }
        ),
        index
      );
    }

    return this;
  }

  public pluck<Arr extends readonly object[], K extends keyof Arr[number]>(
    this: EnsureChainInternal<Arr, Negated>,
    key: K,
    options: EnsureOptions = {}
  ): EnsureChainInternal<Array<Arr[number][K]>, Negated> {
    const chain = this as unknown as EnsureChainImpl<Arr, Negated>;
    const current = chain.state.value as unknown;
    if (!Array.isArray(current)) {
      chain.fail("pluck", {
        message: "Expected value to be an array in order to use ensure(...).pluck(...)",
        actual: chain.state.value,
        expected: "array",
      });
    }

    const values = current as unknown as Arr;
    const mapped = values.map((element, index) => {
      if ((typeof element !== "object" && typeof element !== "function") || element === null) {
        chain.fail("pluck", {
          message: `Expected element at index ${index} to be an object in order to pluck "${String(
            key
          )}"`,
          actual: element,
          expected: "object",
        });
      }
      return (element as Arr[number])[key] as Arr[number][K];
    });

    const nextState = {
      value: mapped,
      negated: chain.state.negated,
      ...(options.label !== undefined
        ? { label: options.label }
        : chain.state.label !== undefined
          ? { label: chain.state.label }
          : {}),
    };
    return new EnsureChainImpl<Array<Arr[number][K]>, Negated>(
      nextState as MatcherState<Array<Arr[number][K]>> & { negated: Negated }
    );
  }

  public prop<Obj extends object, K extends keyof Obj>(
    this: EnsureChainInternal<Obj, Negated>,
    key: K,
    options: EnsureOptions = {}
  ): EnsureChainInternal<Obj[K], Negated> {
    const chain = this as unknown as EnsureChainImpl<Obj, Negated>;
    const current = chain.state.value as unknown;
    if ((typeof current !== "object" && typeof current !== "function") || current === null) {
      chain.fail("prop", {
        message: "Expected value to be an object in order to use ensure(...).prop(...)",
        actual: chain.state.value,
        expected: "object",
      });
    }

    const nextState = {
      value: (current as Obj)[key],
      negated: chain.state.negated,
      ...(options.label !== undefined
        ? { label: options.label }
        : chain.state.label !== undefined
          ? { label: chain.state.label }
          : {}),
    };
    return new EnsureChainImpl<Obj[K], Negated>(
      nextState as MatcherState<Obj[K]> & { negated: Negated }
    );
  }

  public toBe(expected: T): EnsureChainInternal<T, Negated> {
    assertToBe(this.createContext(), expected);
    return this;
  }

  public toEqual(expected: unknown): EnsureChainInternal<T, Negated> {
    assertToEqual(this.createContext(), expected);
    return this;
  }

  public toStrictEqual(expected: unknown): EnsureChainInternal<T, Negated> {
    assertToStrictEqual(this.createContext(), expected);
    return this;
  }

  public toBeDefined(): EnsureChainInternal<Negated extends true ? T : NonNullable<T>, Negated> {
    const defined = assertToBeDefined(this.createContext());
    const next = this.state.negated ? this : this.rewrap(defined);
    return next as EnsureChainInternal<Negated extends true ? T : NonNullable<T>, Negated>;
  }

  public toBeUndefined(): EnsureChainInternal<Negated extends true ? T : undefined, Negated> {
    const result = assertToBeUndefined(this.createContext());
    const next = this.state.negated ? this : this.rewrap(result);
    return next as EnsureChainInternal<Negated extends true ? T : undefined, Negated>;
  }

  public toBeNull(): EnsureChainInternal<Negated extends true ? T : null, Negated> {
    const result = assertToBeNull(this.createContext());
    const next = this.state.negated ? this : this.rewrap(result);
    return next as EnsureChainInternal<Negated extends true ? T : null, Negated>;
  }

  public toBeTruthy(): EnsureChainInternal<T, Negated> {
    assertToBeTruthy(this.createContext());
    return this;
  }

  public toBeFalsy(): EnsureChainInternal<T, Negated> {
    assertToBeFalsy(this.createContext());
    return this;
  }

  public toBeTypeOf<Expected extends EnsureTypeOf>(
    expected: Expected
  ): EnsureChainInternal<Negated extends true ? T : NarrowByTypeOf<T, Expected>, Negated> {
    assertToBeTypeOf(this.createContext(), expected);
    const next = this.state.negated
      ? this
      : this.rewrap(this.state.value as unknown as NarrowByTypeOf<T, Expected>);
    return next as EnsureChainInternal<
      Negated extends true ? T : NarrowByTypeOf<T, Expected>,
      Negated
    >;
  }

  public toBeGreaterThan(
    expected: number
  ): EnsureChainInternal<Negated extends true ? T : Extract<T, number>, Negated> {
    const actual = assertToBeGreaterThan(this.createContext(), expected);
    const next = this.state.negated ? this : this.rewrap(actual as Extract<T, number>);
    return next as EnsureChainInternal<
      Negated extends true ? T : Extract<T, number>,
      Negated
    >;
  }

  public toBeGreaterThanOrEqual(
    expected: number
  ): EnsureChainInternal<Negated extends true ? T : Extract<T, number>, Negated> {
    const actual = assertToBeGreaterThanOrEqual(this.createContext(), expected);
    const next = this.state.negated ? this : this.rewrap(actual as Extract<T, number>);
    return next as EnsureChainInternal<
      Negated extends true ? T : Extract<T, number>,
      Negated
    >;
  }

  public toBeLessThan(
    expected: number
  ): EnsureChainInternal<Negated extends true ? T : Extract<T, number>, Negated> {
    const actual = assertToBeLessThan(this.createContext(), expected);
    const next = this.state.negated ? this : this.rewrap(actual as Extract<T, number>);
    return next as EnsureChainInternal<
      Negated extends true ? T : Extract<T, number>,
      Negated
    >;
  }

  public toBeLessThanOrEqual(
    expected: number
  ): EnsureChainInternal<Negated extends true ? T : Extract<T, number>, Negated> {
    const actual = assertToBeLessThanOrEqual(this.createContext(), expected);
    const next = this.state.negated ? this : this.rewrap(actual as Extract<T, number>);
    return next as EnsureChainInternal<
      Negated extends true ? T : Extract<T, number>,
      Negated
    >;
  }

  public toBeCloseTo(
    expected: number,
    precision?: number
  ): EnsureChainInternal<Negated extends true ? T : Extract<T, number>, Negated> {
    const actual = assertToBeCloseTo(this.createContext(), expected, precision);
    const next = this.state.negated ? this : this.rewrap(actual as Extract<T, number>);
    return next as EnsureChainInternal<
      Negated extends true ? T : Extract<T, number>,
      Negated
    >;
  }

  public toBeInstanceOf(
    ctor: ArrayConstructor
  ): EnsureChainInternal<Negated extends true ? T : NarrowToArray<T>, Negated>;
  public toBeInstanceOf<Ctor extends abstract new (...args: never[]) => unknown>(
    ctor: Ctor
  ): EnsureChainInternal<Negated extends true ? T : InstanceType<Ctor>, Negated>;
  public toBeInstanceOf<Ctor extends abstract new (...args: never[]) => unknown>(
    ctor: Ctor
  ): EnsureChainInternal<
    Negated extends true
      ? T
      : Ctor extends ArrayConstructor
        ? NarrowToArray<T>
        : InstanceType<Ctor>,
    Negated
  > {
    const instance = assertToBeInstanceOf(this.createContext(), ctor);
    const next = this.state.negated ? this : this.rewrap(instance);
    return next as EnsureChainInternal<
      Negated extends true
        ? T
        : Ctor extends ArrayConstructor
          ? NarrowToArray<T>
          : InstanceType<Ctor>,
      Negated
    >;
  }

  public toBeObjectContaining<Shape extends Record<PropertyKey, unknown>>(
    shape: Shape
  ): EnsureChainInternal<T, Negated> {
    assertObjectContaining(this.createContext(), shape);
    return this;
  }

  public toBeArrayContaining(
    expected: readonly unknown[]
  ): EnsureChainInternal<Negated extends true ? T : Extract<T, readonly unknown[]>, Negated> {
    const array = assertArrayContaining(this.createContext(), expected);
    const next = this.state.negated
      ? this
      : this.rewrap(array as Extract<T, readonly unknown[]>);
    return next as EnsureChainInternal<
      Negated extends true ? T : Extract<T, readonly unknown[]>,
      Negated
    >;
  }

  public toContainEqual(
    expected: unknown
  ): EnsureChainInternal<Negated extends true ? T : Extract<T, readonly unknown[]>, Negated> {
    const array = assertContainEqual(this.createContext(), expected);
    const next = this.state.negated
      ? this
      : this.rewrap(array as Extract<T, readonly unknown[]>);
    return next as EnsureChainInternal<
      Negated extends true ? T : Extract<T, readonly unknown[]>,
      Negated
    >;
  }

  public toBeIterableContaining(
    expected: readonly unknown[]
  ): EnsureChainInternal<Negated extends true ? T : Extract<T, Iterable<unknown>>, Negated> {
    const iterable = assertIterableContaining(this.createContext(), expected);
    const next = this.state.negated
      ? this
      : this.rewrap(iterable as Extract<T, Iterable<unknown>>);
    return next as EnsureChainInternal<
      Negated extends true ? T : Extract<T, Iterable<unknown>>,
      Negated
    >;
  }

  public toHaveLength(
    expected: number
  ): EnsureChainInternal<Negated extends true ? T : Extract<T, { length: number }>, Negated> {
    assertHasLength(this.createContext(), expected);
    const next = this.state.negated
      ? this
      : this.rewrap(this.state.value as Extract<T, { length: number }>);
    return next as EnsureChainInternal<
      Negated extends true ? T : Extract<T, { length: number }> ,
      Negated
    >;
  }

  private createContext(): MatcherContext<T> {
    return {
      value: this.state.value,
      negated: this.state.negated,
      fail: (matcher, details) => this.fail(matcher, details),
      ...(this.state.label !== undefined ? { label: this.state.label } : {}),
    } as MatcherContext<T>;
  }

  private rewrap<U>(value: U): EnsureChainImpl<U, Negated> {
    const nextState = {
      value,
      negated: this.state.negated,
      ...(this.state.label !== undefined ? { label: this.state.label } : {}),
    };
    return new EnsureChainImpl<U, Negated>(
      nextState as MatcherState<U> & { negated: Negated }
    );
  }

  private buildEachLabel<E>(
    value: E,
    index: number,
    options: EnsureEachOptions<E>
  ): string | undefined {
    if (typeof options.label === "function") {
      return options.label({ index, value });
    }
    const baseLabel = options.label ?? this.state.label;
    if (!baseLabel) {
      return undefined;
    }
    return `${baseLabel} (index ${index})`;
  }

  private fail(matcher: string, details: FailureDetails): never {
    const errorDetails: EnsureErrorDetails = {
      matcher,
      message: details.message,
      ...(details.actual !== undefined ? { actual: details.actual } : {}),
      ...(details.expected !== undefined ? { expected: details.expected } : {}),
      ...(this.state.label !== undefined ? { receivedLabel: this.state.label } : {}),
    };
    throw new EnsureError(errorDetails);
  }
}
