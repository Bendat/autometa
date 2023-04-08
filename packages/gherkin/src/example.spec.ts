import { describe, it, expect } from "@jest/globals";
import { ExampleBuilder } from "./example";

describe("Example Builder", () => {
  it("should build a valid Scenario", () => {
    const scenario = new ExampleBuilder()
      .name("my example")
      .description("foo")
      .keyword("Example")
      .example({ foo: "1" })
      .build();
    const expected = {
      name: "my example",
      description: "foo",
      keyword: "Example",
      example: { foo: "1" },
    };
    expect({ ...scenario }).toEqual(expected);
    expect(scenario.title).toEqual("Example: my example");
  });
});
