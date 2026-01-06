import type { EnsureChain, EnsureNegatedChain } from "../ensure";

type Assert<T extends true> = T;

// Base chain value exposure
type BaseValue = EnsureChain<string>["value"];
type NegatedBaseValue = EnsureNegatedChain<boolean>["value"];
export type _baseValue = Assert<[BaseValue] extends [string] ? true : false>;
export type _negatedBaseValue = Assert<[NegatedBaseValue] extends [boolean] ? true : false>;

// toBeDefined narrows when not negated
type DefinedChain = ReturnType<EnsureChain<string | undefined>["toBeDefined"]>;
type DefinedValue = DefinedChain["value"];
export type _definedNarrows = Assert<[DefinedValue] extends [string] ? true : false>;
export type _definedEqualsString = Assert<[string] extends [DefinedValue] ? true : false>;

// Negated toBeDefined retains union
type NegatedDefinedChain = ReturnType<
  EnsureNegatedChain<string | undefined>["toBeDefined"]
>;
type NegatedDefinedValue = NegatedDefinedChain["value"];
export type _negatedDefinedRetains = Assert<
  [NegatedDefinedValue] extends [string | undefined] ? true : false
>;
export type _negatedDefinedAllowsUndefined = Assert<
  [string | undefined] extends [NegatedDefinedValue] ? true : false
>;

// Instance checks
type InstanceNarrows = EnsureChain<Error | TypeError> extends {
  toBeInstanceOf(ctor: typeof TypeError): { value: TypeError };
}
  ? true
  : false;
export type _instanceNarrows = Assert<InstanceNarrows>;

type NegatedInstanceRetains = EnsureNegatedChain<Error | TypeError> extends {
  toBeInstanceOf(ctor: typeof TypeError): { value: Error | TypeError };
}
  ? true
  : false;
export type _negatedInstanceRetains = Assert<NegatedInstanceRetains>;

// Array containment narrows to readonly array when positive
type ArrayContainingNarrows = EnsureChain<readonly number[] | Set<number>> extends {
  toBeArrayContaining(expected: readonly number[]): { value: readonly number[] };
}
  ? true
  : false;
export type _arrayContainingNarrows = Assert<ArrayContainingNarrows>;

type NegatedArrayContainingRetains = EnsureNegatedChain<readonly number[] | Set<number>> extends {
  toBeArrayContaining(expected: readonly number[]): {
    value: readonly number[] | Set<number>;
  };
}
  ? true
  : false;
export type _negatedArrayContainingRetains = Assert<NegatedArrayContainingRetains>;

// Iterable containment narrows iterable branch
type IterableContainingNarrows = EnsureChain<Iterable<number> | number> extends {
  toBeIterableContaining(expected: readonly unknown[]): { value: Iterable<number> };
}
  ? true
  : false;
export type _iterableContainingNarrows = Assert<IterableContainingNarrows>;

type NegatedIterableContainingRetains = EnsureNegatedChain<Iterable<number> | number> extends {
  toBeIterableContaining(expected: readonly unknown[]): { value: Iterable<number> | number };
}
  ? true
  : false;
export type _negatedIterableContainingRetains = Assert<NegatedIterableContainingRetains>;

// Length matcher narrows to length-bearing branch for positive case
type LengthNarrows = EnsureChain<string | number> extends {
  toHaveLength(expected: number): { value: string };
}
  ? true
  : false;
export type _lengthNarrows = Assert<LengthNarrows>;

type NegatedLengthRetains = EnsureNegatedChain<string | number> extends {
  toHaveLength(expected: number): { value: string | number };
}
  ? true
  : false;
export type _negatedLengthRetains = Assert<NegatedLengthRetains>;
