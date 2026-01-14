import { describe, expect, it } from "vitest";
import { def, fallback, overloads } from "../overloads";
import { string, number } from "../../validators/primitives";
import { NoOverloadMatchedError } from "../../core/errors";

describe("authoring overloads", () => {
  it("invokes the most specific matching handler", () => {
    const invocations: string[] = [];
    const signatures = overloads(
      def`string overload`("matches strings", string()).match((value: unknown) => {
        invocations.push("string");
        return `str:${value}`;
      }),
      def("numbers", number()).match((value: unknown) => {
        invocations.push("number");
        return (value as number) + 1;
      })
    );

    const stringResult = signatures.use(["hello"]);
    const numberResult = signatures.use([2]);

    expect(stringResult).toBe("str:hello");
    expect(numberResult).toBe(3);
    expect(invocations).toEqual(["string", "number"]);
  });

  it("falls back when no signature matches", () => {
    const signatures = overloads(
      def(string()).match((value: unknown) => `value:${value}`),
      fallback("default fallback", (...args) => `fallback:${args.length}`)
    );

    const result = signatures.use([123]);
    expect(result).toBe("fallback:1");
  });

  it("supports throws definitions", () => {
    const signatures = overloads(
      def(string()).throws(TypeError, "invalid"),
      fallback(() => "fallback")
    );

    expect(() => signatures.use(["boom"])).toThrowError(TypeError);
  });

  it("throws when no signatures match and no fallback is provided", () => {
    const signatures = overloads(def(number()).match((value: unknown) => value));

    expect(() => signatures.use(["nope"])).toThrowError(NoOverloadMatchedError);
  });

  it("enforces validators presence", () => {
    expect(() => def({ name: "missing" })).toThrowError("def requires at least one validator");
  });

  it("throws when fallback is missing a handler", () => {
    expect(() => fallback("desc", undefined as unknown as () => unknown)).toThrowError(
      "fallback requires a handler function"
    );
  });

  it("allows metadata objects alongside description strings", () => {
    const signatures = overloads(
      def("with description", { name: "meta" }, string()).match((value: unknown) => value)
    );

    expect(signatures.use(["ok"])).toBe("ok");
  });
});
