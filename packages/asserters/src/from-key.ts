import { AssertKey } from "./assert-key";
export function FromKey<TReturn>(item: Record<string, unknown>, key: string) {
  AssertKey(item, key);
  return item[key] as TReturn;
}
