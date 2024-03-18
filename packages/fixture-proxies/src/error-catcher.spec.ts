import { describe, it, expect } from "vitest";
import { ErrorCatcherProxy, DecorateErrorCatch } from "./error-catcher";

describe("ErrorCatcher", () => {
  it("should catch errors", () => {
    const obj = ErrorCatcherProxy({
      foo() {
        throw new Error("foo");
      },
    });
    expect(() => obj.foo()).toThrowError("foo");
  });
});

@DecorateErrorCatch
class TestFixture {
  foo() {
    throw new Error("foo");
  }
}

describe("decorator", () => {
  it("should catch errors", () => {
    const fixture = new TestFixture();
    expect(() => fixture.foo()).toThrowError("foo");
  });
});
