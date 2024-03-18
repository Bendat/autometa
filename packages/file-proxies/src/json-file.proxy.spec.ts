import { describe, it, expect } from "vitest";
import { FileObject } from "./json-file-proxy";
import { mkdtempSync, rmdirSync } from "node:fs";
import path from "path";
import { afterEach } from "node:test";

describe("json-file-proxy", () => {
  let filepath : string
  it("should read and write", () => {
    const dir = mkdtempSync("tmp");
     filepath = path.resolve(dir, "tmp.json");
    console.log(filepath);
    const file = FileObject<{ foo: string }>(filepath);
    file.foo = "bar";
    expect(file.foo).toBe("bar");
  });

  afterEach(() => {
    console.log("deleting", filepath);
    rmdirSync(path.dirname(filepath), { recursive: true });
  })
});
