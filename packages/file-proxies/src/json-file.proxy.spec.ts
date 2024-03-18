import { describe, it, expect } from "vitest";
import { FileObject } from "./json-file-proxy";
import { mkdtempSync } from "node:fs";
import path from "path";

describe("json-file-proxy", () => {
  it("should read and write", () => {
    const dir = mkdtempSync("tmp");
    const filepath = path.resolve(dir, "tmp.json");
    console.log(filepath);
    const file = FileObject<{ foo: string }>(filepath);
    file.foo = "bar";
    expect(file.foo).toBe("bar");
  });
});
