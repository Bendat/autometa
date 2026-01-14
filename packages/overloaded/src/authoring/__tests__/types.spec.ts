import { describe, it } from "vitest";
import { def } from "../overloads";
import { string, number } from "../../validators/primitives";
import { union } from "../../validators/composite";

describe("def typing", () => {
  it("derives handler parameter tuple from validator list", () => {
    const builder = def(string(), number());
    builder.match((first, second) => {
      const upper = first.toUpperCase();
      const incremented = second + 1;
      return `${upper}:${incremented}`;
    });
  });

  it("propagates validator value types through unions", () => {
    const builder = def(union([string(), number()]));
    builder.match((value) => {
      if (typeof value === "string") {
        return value.toUpperCase();
      }
      return value.toFixed(2);
    });
  });
});
