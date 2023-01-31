import { describe, test } from "vitest";
import { convertToMarkdown } from "./transformer";
import { readFileSync, writeFileSync } from "fs";

const feature = `Feature: A
Scenario: Foo
    Given a boo
    When a groo
`;
describe("Foo", () => {
  test("foo", async () => {
    const text = readFileSync("./src/example.feature", "utf-8");
    const file = convertToMarkdown(text);
    writeFileSync("./example.md", file);
  });
});
