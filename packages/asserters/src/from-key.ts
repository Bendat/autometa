import { AssertKey } from "./assert-key";
export function FromKey<TObj, TReturn>(item: TObj, key: string) {
  AssertKey(item, key);
  return item[key] as TReturn;
}
