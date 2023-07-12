import { AnyFunction } from "@autometa/types";
import { AssertKey } from "./assert-key";
export function FromKey<TReturn>(item: Record<string, unknown> | AnyFunction, key: string) {
  AssertKey(item, key);
  return item[key] as TReturn;
}
