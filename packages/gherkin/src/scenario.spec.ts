import { describe, it, expect } from "vitest";
import { ScenarioBuilder } from "./scenario";

describe("Scenario Builder", () => {
  it("should build a valid Scenario", () => {
    const scenario = new ScenarioBuilder()
      .name("my scenario")
      .description("foo")
      .keyword("Scenario")
      .build();
    const expected = {
      children: [],
      tags: new Set(),
      name: "my scenario",
      description: "foo",
      keyword: "Scenario",
    };
    expect({ ...scenario }).toEqual(expected);
    expect(scenario.title).toEqual("Scenario: my scenario");
  });
});
