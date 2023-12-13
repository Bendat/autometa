import { describe, it, expect } from "vitest";
import { defineContainerContext } from "./container-context";

describe("injection context", () => {
  it("should return the global symbol", () => {
    const context = defineContainerContext("global");
    expect(context).toEqual(Symbol.for("autometa:container:global"));
  });

  it("should return a symbol for a named context", () => {
    const context = defineContainerContext("foo");
    expect(context).toEqual(Symbol.for("autometa:container:foo"));
  });

  it("should reuse named contexts", () => {
    const context1 = defineContainerContext("foo");
    const context2 = defineContainerContext("foo");
    expect(context1).toEqual(context2);
  });
});
