import { describe, it, expectTypeOf } from "vitest";
import { def } from "../overloads";
import { string, number } from "../../validators/primitives";
import { union } from "../../validators/composite";

describe("def typing", () => {
  it("derives handler parameter tuple from validator list", () => {
    const builder = def(string(), number());
    type Handler = Parameters<typeof builder.match>[0];
    type HandlerArgs = Parameters<Handler>;
    expectTypeOf<HandlerArgs>().toEqualTypeOf<[string, number]>();
  });

  it("propagates validator value types through unions", () => {
    const builder = def(union([string(), number()]));
    type Handler = Parameters<typeof builder.match>[0];
    type HandlerArgs = Parameters<Handler>;
    expectTypeOf<HandlerArgs>().toEqualTypeOf<[string | number]>();
  });
});
