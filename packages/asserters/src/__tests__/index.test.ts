import { describe, expect, it } from "vitest";

import * as asserters from "../index.js";

describe("@autometa/asserters index exports", () => {
  it("exports the public API", () => {
    expect(asserters.assertDefined).toBeTypeOf("function");
    expect(asserters.assertIs).toBeTypeOf("function");
    expect(asserters.assertKey).toBeTypeOf("function");
    expect(asserters.confirmKey).toBeTypeOf("function");
    expect(asserters.getKey).toBeTypeOf("function");
    expect(asserters.assertLength).toBeTypeOf("function");
    expect(asserters.assertMinLength).toBeTypeOf("function");
    expect(asserters.assertMaxLength).toBeTypeOf("function");
    expect(asserters.InvalidKeyError).toBeTypeOf("function");
    expect(asserters.lie).toBeTypeOf("function");
    expect(asserters.unsafeCast).toBeTypeOf("function");
  });
});

