import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "path";

export function FileObject<T extends Record<string, unknown>>(
  filepath: string
): T {
  filepath = path.resolve(filepath);
  let raw = {} as T;
  return new Proxy<T>(
    raw,
    {
      get: (_, prop) => {
        makeIfNotExists(filepath);
        const value = readFileSync(filepath, "utf-8");
        raw = JSON.parse(value);
        return raw[prop as keyof T];
      },

      set: (_, prop, value) => {
        makeIfNotExists(filepath);
        raw[prop as keyof T] = value;
        const stringified = JSON.stringify(raw, null, 2);
        writeFileSync(filepath, stringified);
        return true;
      }
    }
  );
}

function makeIfNotExists(filepath: string) {
  if(!existsSync) {
    writeFileSync(filepath, "");
  }
}