// workaround for jest failing to recognize default properly
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { parse } from "./tag-expressions";
export function isTagsMatch(tags: string[], filter?: string): boolean {
  if ("@skip" in tags || "@ignore" in tags || "@skpped" in tags) {
    return false;
  }
  if (filter) {
    return parse(filter).evaluate(tags);
  }
  return true;
}
