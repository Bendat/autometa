import { describe, expect, it } from "vitest";

import { getEventDispatcher, resetEventBus } from "../bus.js";

describe("event bus", () => {
  it("returns a stable singleton until reset", () => {
    resetEventBus();
    const first = getEventDispatcher();
    const second = getEventDispatcher();
    expect(Object.is(first, second)).toBe(true);

    resetEventBus();
    const third = getEventDispatcher();
    expect(Object.is(third, first)).toBe(false);
  });
});
