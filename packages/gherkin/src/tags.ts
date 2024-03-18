// workaround for jest failing to recognize default properly
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { parse } from "./tag-expressions";
export function isTagsMatch(tags: string[], filter?: string): boolean {
  if (
    tags.includes("@skip") ||
    tags.includes("@ignore") ||
    tags.includes("@skipped")
  ) {
    return false;
  }
  if (filter) {
    return parse(filter).evaluate(tags);
  }
  return true;
}
