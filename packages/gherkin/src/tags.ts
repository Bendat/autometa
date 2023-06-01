import parse from "@cucumber/tag-expressions";

export function isTagsMatch(tags: string[], filter?: string) {
  if (filter) {
    return parse(filter).evaluate(tags)
  }

  return true;
}
