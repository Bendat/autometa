import { Property } from "@autometa/dto-builder";
import parse from "@cucumber/tag-expressions";
export abstract class GherkinNode {
  @Property
  readonly tags: readonly string[];
  canExecute(tagExpression?: string) {
    if (!tagExpression) {
      return true;
    }
    return parse(tagExpression).evaluate(this.tags as string[]);
  }
}
