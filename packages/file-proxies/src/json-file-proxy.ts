import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "path";
import _ from "lodash";
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
/**
 * Acts like a standard object whose values can be get or set,
 * but it reads and writes to a persistent json file in the background.
 *
 * @example
 * ```ts
 * const file = FileObject<{ foo: string }>("tmp.json");
 * file.foo = "bar";
 * console.log(file.foo); // "bar"
 * console.log(readFileSync("tmp.json", "utf-8")); // {"foo": "bar"}
 * ```
 *
 * @example
 * Arrays and nested objects require a template to be passed,
 * describing their expected structure:
 *
 * ```ts
 * const file = FileObject<{ foo: { bar: string } }>("tmp.json", {
 *  foo: {},
 * });
 * ```
 * With an array:
 *
 * ```ts
 * const file = FileObject<{foo: {bar: string, baz: string}[]}>("tmp.json", {foo: []})
 * file.foo.push({bar: 'baz', baz: 'qux'})
 * console.log(file.foo[0].bar) // "baz"
 * console.log(file.foo[0].baz) // "qux"
 * ```
 * @param filepath the persistent file to read and write to. The file will be created if it doesn't exist.
 * @param template a template object that describes the expected structure of the file, if arrays or nested objects are used.
 * @returns a proxy object that reads and writes to the file.
 */
export function FileObject<T extends Record<string | symbol, unknown>>(
  filepath: string,
  template: DeepPartial<T> = {} as DeepPartial<T>
): T {
  filepath = path.resolve(filepath);
  let raw = _.cloneDeep(template) as T;
  return new Proxy<T>(raw, {
    get: (_, prop) => {
      makeIfNotExists(filepath, raw);
      const value = readFileSync(filepath, "utf-8");
      raw = JSON.parse(value);
      if (typeof raw[prop] === "object" && raw[prop] !== null) {
        return new Proxy(raw[prop] as object, subObjectHandler(raw, filepath));
      }
      return raw[prop as keyof T];
    },

    set: (_, prop, value) => {
      makeIfNotExists(filepath, raw);
      raw[prop as keyof T] = value;
      const stringified = JSON.stringify(raw, null, 2);
      writeFileSync(filepath, stringified);
      return true;
    },
  });
}

function makeIfNotExists(filepath: string, body: object) {
  if (!existsSync(filepath)) {
    writeFileSync(filepath, JSON.stringify(body, null, 2));
  }
}

function subObjectHandler(raw: object, filepath: string): ProxyHandler<object> {
  const handler = {
    get: (target: Record<string | symbol, unknown>, key: string) => {
      if (typeof target[key] === "object" && target[key] !== null) {
        return new Proxy(target[key] as object, handler);
      } else {
        return target[key];
      }
    },
    set: (
      target: Record<string | symbol, unknown>,
      prop: string,
      value: unknown
    ) => {
      target[prop] = value;
      const stringified = JSON.stringify(raw, null, 2);
      writeFileSync(filepath, stringified);
      return true;
    },
  } as ProxyHandler<object>;
  return handler;
}
