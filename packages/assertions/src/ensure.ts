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
import { assertToBeFalsy, assertToBeTruthy } from "./matchers/truthiness";

export interface EnsureOptions {
  readonly label?: string;
}

type Toggle<Negated extends boolean> = Negated extends true ? false : true;

interface EnsureChainInternal<T, Negated extends boolean> {
  readonly value: T;
  readonly not: EnsureChainInternal<T, Toggle<Negated>>;
  toBe(expected: T): EnsureChainInternal<T, Negated>;
  toEqual(expected: unknown): EnsureChainInternal<T, Negated>;
  toStrictEqual(expected: unknown): EnsureChainInternal<T, Negated>;
  toBeDefined(): EnsureChainInternal<Negated extends true ? T : NonNullable<T>, Negated>;
  toBeUndefined(): EnsureChainInternal<Negated extends true ? T : undefined, Negated>;
  toBeNull(): EnsureChainInternal<Negated extends true ? T : null, Negated>;
  toBeTruthy(): EnsureChainInternal<T, Negated>;
  toBeFalsy(): EnsureChainInternal<T, Negated>;
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

  public toBeInstanceOf<Ctor extends abstract new (...args: never[]) => unknown>(
    ctor: Ctor
  ): EnsureChainInternal<Negated extends true ? T : InstanceType<Ctor>, Negated> {
    const instance = assertToBeInstanceOf(this.createContext(), ctor);
    const next = this.state.negated ? this : this.rewrap(instance);
    return next as EnsureChainInternal<Negated extends true ? T : InstanceType<Ctor>, Negated>;
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
