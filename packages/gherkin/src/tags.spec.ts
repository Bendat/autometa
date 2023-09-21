import { describe, it, expect } from "vitest";
import { isTagsMatch } from "./tags";
describe("tags", () => {
  it("should match a tag expression", () => {
    const expression = "@foo and @bar";
    const tags = ["@foo", '@bar'];
    const actual = isTagsMatch(tags, expression);
    const expected = true;
    expect(actual).toEqual(expected);
  });
});
