import { describe, expect, it } from "vitest";
import { Bind, Freeze } from "../index";

class BindFixture {
  public count = 0;

  @Bind
  increment(): void {
    this.count += 1;
  }
}

class FreezeFixture {
  public lastMessage: string | undefined;

  @Freeze
  setMessage(message: string): void {
    this.lastMessage = message;
  }
}

describe("@Bind", () => {
  it("binds the instance context when extracted", () => {
    const fixture = new BindFixture();
    const increment = fixture.increment;

    increment();
    expect(fixture.count).toBe(1);
  });

  it("rebinds reassigned functions", () => {
    const fixture = new BindFixture();

    fixture.increment = function reassigned(this: BindFixture) {
      this.count += 5;
    };

    const increment = fixture.increment;
    increment();

    expect(fixture.count).toBe(5);
  });

  it("throws when decorating a non-method property", () => {
    expect(() =>
      Bind(
        {},
        "notAMethod",
        {
          configurable: true,
          enumerable: true,
          value: "string" as unknown as () => void,
        }
      )
    ).toThrow(TypeError);
  });

  it("throws when assigning a non-function value", () => {
    const fixture = new BindFixture();

    expect(() => {
      fixture.increment = "not a function" as unknown as typeof fixture.increment;
    }).toThrow(TypeError);
  });
});

describe("@Freeze", () => {
  it("binds the instance context when extracted", () => {
    const fixture = new FreezeFixture();
    const setter = fixture.setMessage;

    setter("hello");
    expect(fixture.lastMessage).toBe("hello");
  });

  it("prevents reassignment", () => {
    const fixture = new FreezeFixture();

    expect(() => {
      fixture.setMessage = function noop(this: FreezeFixture): void {
        this.lastMessage = "noop";
      };
    }).toThrow(TypeError);
  });
});
