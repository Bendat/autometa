import { iterableEquality, subsetEquality, type Tester } from "@jest/expect-utils";

export const MATCHER_CALL = "ensure(received)";

export const EQUALITY_TESTERS: Tester[] = [iterableEquality];

export const SUBSET_TESTERS: Tester[] = [iterableEquality, subsetEquality];
