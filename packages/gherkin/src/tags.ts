import parse from "@cucumber/tag-expressions";

export function isTagsMatch(tags: string[], filter?: string) {
  if ("@skip" in tags || "@ignore" in tags || "@skpped" in tags) {
    return false;
  }
  if (filter) {
    return parse(filter).evaluate(tags);
  }
  return true;
}
