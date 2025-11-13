declare module "@cucumber/tag-expressions" {
  export interface TagExpression {
    evaluate(tags: readonly string[]): boolean;
  }

  export function parse(expression: string): TagExpression;
}
