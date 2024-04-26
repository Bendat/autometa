import { describe, it, expect, afterEach } from "vitest";
import { FileObject } from "./json-file-proxy";
import { mkdtempSync, rmdirSync } from "node:fs";
import path from "path";

describe("json-file-proxy", () => {
  let filepath: string;
  it("should read and write", () => {
    const dir = mkdtempSync("tmp");
    filepath = path.resolve(dir, "tmp.json");
    console.log(filepath);
    const file = FileObject<{ foo: string }>(filepath);
    file.foo = "bar";
    expect(file.foo).toBe("bar");
  });
  it("should read and write nested objects", () => {
    const dir = mkdtempSync("tmp");
    filepath = path.resolve(dir, "tmp.json");
    console.log(filepath);
    const file = FileObject<{ foo: { bar: string } }>(filepath, {
      foo: {},
    });
    file.foo = { bar: "baz" };
    expect(file.foo.bar).toBe("baz");
  });

  it('should read and write with nested and unnested array', ()=>{
    const dir = mkdtempSync('tmp')
    filepath = path.resolve(dir, 'tmp.json')
    console.log(filepath)
    const file = FileObject<{foo: {bar: string, baz: string}[]}>(filepath, {foo: []})
    file.foo.push({bar: 'baz', baz: 'qux'})
    expect(file.foo[0].bar).toBe('baz')
    expect(file.foo[0].baz).toBe('qux')
  })

  afterEach(() => {
    console.log("deleting", filepath);
    rmdirSync(path.dirname(filepath), { recursive: true });
  });
});
