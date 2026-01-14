import { describe, expect, it } from "vitest";
import { overloads, def, fallback } from "../authoring/overloads";
import { string, number, boolean } from "../validators/primitives";
import { array, shape, tuple } from "../validators/composite";

describe("Scenario: user score routing", () => {
  const orchestrator = overloads(
    def`user and score`("name then score", string(), number({ min: 0 })).match((name, score) => ({
      route: "direct-args",
      name: name as string,
      score: score as number,
    })),
    def("payload", shape({
      user: shape({
        name: string(),
        active: boolean({ optional: true }),
      }),
      scores: array(number({ min: 0 }), { minLength: 1 }),
    })).match((payload) => {
      const typed = payload as { user: { name: string }; scores: number[] };
      return {
        route: "payload",
        name: typed.user.name,
        score: typed.scores.reduce((total, value) => total + value, 0),
      };
    }),
    def("tuple input", tuple([string(), number({ integer: true })], { allowExtra: true })).match((entry) => {
      const [name, score] = entry as [string, number, ...unknown[]];
      return {
        route: "tuple",
        name,
        score,
      };
    }),
    fallback("default handler", (...args) => ({ route: "fallback", received: args })),
  );

  it("handles direct argument invocations", () => {
    const result = orchestrator.use(["Alice", 21]);
    expect(result).toEqual({ route: "direct-args", name: "Alice", score: 21 });
  });

  it("supports structured payload objects", () => {
    const result = orchestrator.use([
      {
        user: { name: "Bob" },
        scores: [5, 7],
      },
    ]);

    expect(result).toEqual({ route: "payload", name: "Bob", score: 12 });
  });

  it("accepts tuple entries with optional extras", () => {
    const result = orchestrator.use([["Carol", 42, "ignored"]]);
    expect(result).toEqual({ route: "tuple", name: "Carol", score: 42 });
  });

  it("falls back when nothing matches", () => {
    const result = orchestrator.use([true, { kind: "unknown" }]);
    expect(result).toEqual({ route: "fallback", received: [true, { kind: "unknown" }] });
  });
});
