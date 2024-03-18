import parse from "@cucumber/tag-expressions";
export abstract class GherkinNode {
  abstract readonly keyword: string;
  children: GherkinNode[] = [];
  readonly tags: Set<string> = new Set();

  canExecute(tagExpression?: string) {
    if (!tagExpression) {
      return true;
    }
    return parse(tagExpression).evaluate([...this.tags]);
  }
}
