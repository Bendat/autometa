import { Property } from "@autometa/dto-builder";
import parse from "@cucumber/tag-expressions";
export abstract class GherkinNode {
  abstract readonly keyword: string;
  @Property
  children: GherkinNode[] = [];
  @Property
  readonly tags: Set<string> = new Set();
  
  canExecute(tagExpression?: string) {
    if (!tagExpression) {
      return true;
    }
    return parse(tagExpression).evaluate([...this.tags]);
  }
}
