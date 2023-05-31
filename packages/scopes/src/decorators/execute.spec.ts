import { describe, expect, it, vi } from "vitest";
import { Execute } from "./execute";

const tracker = vi.fn().mockImplementation((..._args: unknown[]) => undefined);
class TestFoo {
  onFeatureExecuted(...args: unknown[]) {
    return tracker(...args);
  }

  @Execute
  double(num: number) {
    return num * 2;
  }
}

describe("Decorators", () => {
  it("Execute should call the `onFeatureExecuted` method", () => {
    const sut = new TestFoo();
    const result = sut.double(1);
    expect(result).toEqual(2);
    expect(tracker).toHaveBeenCalledWith(2);
  });
});
