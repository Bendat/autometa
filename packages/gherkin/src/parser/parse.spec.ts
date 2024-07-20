import { scenarioExampleTitle } from "./parse";
import { describe, expect, test } from "vitest";

describe("interpolate example titles", () => {
  test("interpolate values", () => {
    const result = scenarioExampleTitle(["a", "b"], "I have a <a> in my <b>", [
      "Cat",
      "Hat",
    ]);
    expect(result).toEqual("I have a Cat in my Hat");
  });

  test('add values as suffix', ()=>{
    const result = scenarioExampleTitle(["a"], "I have a a jive in my step", [
      "Cat",
    ]);
    console.log(result)
  })
});
