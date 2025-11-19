import type { EnsureChain, EnsureNegatedChain } from "../ensure";

type ExpectTrue<T extends true> = T;
type DoesExtend<Actual, Expected> = [Actual] extends [Expected] ? true : false;
type ExpectExtends<Actual, Expected> = ExpectTrue<
  DoesExtend<Actual, Expected> extends true ? true : false
>;
type ExpectEqual<Actual, Expected> = [
  ExpectExtends<Actual, Expected>,
  ExpectExtends<Expected, Actual>
];

// Base value typing
export type ValueType = ExpectEqual<EnsureChain<string>["value"], string>;
export type NegatedValueType = ExpectEqual<EnsureNegatedChain<boolean>["value"], boolean>;

// .not toggling retains value type but flips negation state
export type NegateOnce = ExpectEqual<EnsureChain<number>["not"], EnsureNegatedChain<number>>;
export type NegateTwice = ExpectEqual<EnsureNegatedChain<number>["not"], EnsureChain<number>>;

// Nullish matchers narrow when not negated and preserve unions when negated
type ToBeDefinedPositiveChain = ReturnType<EnsureChain<string | undefined>["toBeDefined"]>;
export type ToBeDefinedPositiveValue = ExpectEqual<ToBeDefinedPositiveChain["value"], string>;

type ToBeDefinedNegatedChain = ReturnType<
  EnsureNegatedChain<string | undefined>["toBeDefined"]
>;
export type ToBeDefinedNegatedValue = ExpectEqual<
  ToBeDefinedNegatedChain["value"],
  string | undefined
>;

type ToBeUndefinedChain = ReturnType<EnsureChain<string | undefined>["toBeUndefined"]>;
export type ToBeUndefinedValue = ExpectEqual<ToBeUndefinedChain["value"], undefined>;

type ToBeNullChain = ReturnType<EnsureChain<string | null>["toBeNull"]>;
export type ToBeNullValue = ExpectEqual<ToBeNullChain["value"], null>;

// Instance checks narrow to ctor instance type when not negated
type InstancePositiveChain = EnsureChain<Error | TypeError> extends {
  toBeInstanceOf(ctor: typeof TypeError): infer R;
}
  ? R
  : never;
export type ToBeInstanceOfPositiveValue = ExpectEqual<InstancePositiveChain["value"], TypeError>;

type InstanceNegatedChain = EnsureNegatedChain<Error | TypeError> extends {
  toBeInstanceOf(ctor: typeof TypeError): infer R;
}
  ? R
  : never;
export type ToBeInstanceOfNegatedValue = ExpectEqual<
  InstanceNegatedChain["value"],
  Error | TypeError
>;

// Array containment drops non-array branches when positive and preserves unions when negated
type ArrayContainingPositiveChain = EnsureChain<readonly number[] | Set<number>> extends {
  toBeArrayContaining(expected: readonly unknown[]): infer R;
}
  ? R
  : never;
export type ToBeArrayContainingPositiveValue = ExpectEqual<
  ArrayContainingPositiveChain["value"],
  readonly number[]
>;

type ArrayContainingNegatedChain = EnsureNegatedChain<readonly number[] | Set<number>> extends {
  toBeArrayContaining(expected: readonly unknown[]): infer R;
}
  ? R
  : never;
export type ToBeArrayContainingNegatedValue = ExpectEqual<
  ArrayContainingNegatedChain["value"],
  readonly number[] | Set<number>
>;

type ContainEqualPositiveChain = EnsureChain<readonly number[] | Set<number>> extends {
  toContainEqual(expected: unknown): infer R;
}
  ? R
  : never;
export type ToContainEqualPositiveValue = ExpectEqual<
  ContainEqualPositiveChain["value"],
  readonly number[]
>;

// Iterable containment narrows to iterable branch
type IterableContainingPositiveChain = EnsureChain<Iterable<number> | string> extends {
  toBeIterableContaining(expected: readonly unknown[]): infer R;
}
  ? R
  : never;
export type ToBeIterableContainingPositiveValue = ExpectEqual<
  IterableContainingPositiveChain["value"],
  Iterable<number>
>;

// Length matcher narrows to values with length when positive and preserves negated unions
type LengthPositiveChain = EnsureChain<number[] | Set<number>> extends {
  toHaveLength(expected: number): infer R;
}
  ? R
  : never;
export type ToHaveLengthPositiveValue = ExpectEqual<LengthPositiveChain["value"], number[]>;

type LengthNegatedChain = EnsureNegatedChain<number[] | Set<number>> extends {
  toHaveLength(expected: number): infer R;
}
  ? R
  : never;
export type ToHaveLengthNegatedValue = ExpectEqual<
  LengthNegatedChain["value"],
  number[] | Set<number>
>;
