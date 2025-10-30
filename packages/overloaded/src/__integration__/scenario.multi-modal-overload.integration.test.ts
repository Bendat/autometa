import { describe, expect, it, vi, beforeEach } from "vitest";
import { overloads, def } from "../authoring/overloads";
import { array, shape, tuple } from "../validators/composite";
import { boolean, func, number, string, unknown } from "../validators/primitives";

describe("Scenario: multi-modal overload", () => {
  const handlerSpy = vi.fn();

  const resolver = overloads(
    def("strings", string(), string()).match((first, second) => {
      handlerSpy(first, second);
      return `${first as string}:${second as string}`;
    }),
    def("numbers", number(), number()).match((first, second) => {
      handlerSpy(first, second);
      return (first as number) + (second as number);
    }),
    def("tuple and flag", tuple([string(), number()]), boolean()).match((pair, flag) => {
      handlerSpy(pair, flag);
      const typed = pair as [string, number];
      return [...typed, flag as boolean];
    }),
    def("mixed array", array([string(), number()])).match((payload) => {
      handlerSpy(payload);
      const [label, value] = payload as [string, number];
      return { label, value };
    }),
    def("shape payload", shape({
      user: string(),
      stats: array(number(), { minLength: 1 }),
    })).match((payload) => {
      handlerSpy(payload);
      const typed = payload as { user: string; stats: number[] };
      return {
        user: typed.user,
        total: typed.stats.reduce((total, value) => total + value, 0),
      };
    }),
    def("string tail", string(), unknown(), boolean()).match((label, _unknown, flag) => {
      handlerSpy(label, flag);
      return { label: label as string, flag: flag as boolean };
    }),
    def("function input", func({ arity: 1 })).match((callback) => {
      handlerSpy(callback);
      const typed = callback as (value: string) => string;
      return typed("input");
    })
  );

  beforeEach(() => {
    handlerSpy.mockClear();
  });

  it("picks the string overload", () => {
    const result = resolver.use(["hello", "world"]);
    expect(handlerSpy).toHaveBeenCalledWith("hello", "world");
    expect(result).toBe("hello:world");
  });

  it("matches the numeric overload", () => {
    const result = resolver.use([2, 3]);
    expect(handlerSpy).toHaveBeenCalledWith(2, 3);
    expect(result).toBe(5);
  });

  it("resolves tuple and boolean payloads", () => {
    const result = resolver.use([["one", 1], true]);
    expect(handlerSpy).toHaveBeenCalledWith(["one", 1], true);
    expect(result).toEqual(["one", 1, true]);
  });

  it("handles mixed arrays", () => {
    const result = resolver.use([["label", 9]]);
    expect(handlerSpy).toHaveBeenCalledWith(["label", 9]);
    expect(result).toEqual({ label: "label", value: 9 });
  });

  it("supports shape payloads", () => {
    const result = resolver.use([{ user: "Ada", stats: [1, 2, 3] }]);
    expect(handlerSpy).toHaveBeenCalledWith({ user: "Ada", stats: [1, 2, 3] });
    expect(result).toEqual({ user: "Ada", total: 6 });
  });

  it("matches trailing flag overload", () => {
    const result = resolver.use(["tag", null, false]);
    expect(handlerSpy).toHaveBeenCalledWith("tag", false);
    expect(result).toEqual({ label: "tag", flag: false });
  });

  it("accepts function overloads", () => {
    const callback = vi.fn((value: string) => `${value}!`);
    const result = resolver.use([callback]);
    expect(handlerSpy).toHaveBeenCalledWith(callback);
    expect(result).toBe("input!");
  });
});
