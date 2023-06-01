import { describe, it, expect } from "vitest";
import { BackgroundBuilder } from "./background";

describe("Background Builder", () => {
  it("should build a valid Background", () => {
    const background = new BackgroundBuilder()
      .name("my background")
      .keyword("Background")
      .description("foo")
      .build();
    const expected = {
      tags: new Set(),
      children: [],
      name: "my background",
      description: "foo",
      keyword: "Background",
    };
    expect({ ...background }).toEqual(expected);
    expect(background.title).toEqual("Background: my background");
  });
});
