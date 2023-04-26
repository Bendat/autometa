import { expect, it } from "vitest";

it("tests", () => {
  function foo() {}
  console.log(`ctr ${foo.constructor}`);
});
