import * as TagExpressions from "@cucumber/tag-expressions";

export interface TagFilter {
  evaluate(tags: readonly string[]): boolean;
}

const ALWAYS_TRUE: TagFilter = {
  evaluate: () => true,
};

type TagExpressionParser = (expression: string) => { evaluate(tags: readonly string[]): boolean };

const resolveParser = (): TagExpressionParser => {
  const namespace = TagExpressions as {
    readonly parse?: unknown;
    readonly default?: unknown;
  };

  if (typeof namespace.parse === "function") {
    return namespace.parse as TagExpressionParser;
  }

  if (typeof namespace.default === "function") {
    return namespace.default as TagExpressionParser;
  }

  throw new Error("Unable to resolve @cucumber/tag-expressions parser export");
};

const parseExpression = resolveParser();

export const createTagFilter = (expression: string | undefined): TagFilter => {
  if (!expression || expression.trim().length === 0) {
    return ALWAYS_TRUE;
  }

  const parsed = parseExpression(expression);
  return {
    evaluate(tags: readonly string[]) {
      return parsed.evaluate(tags.map((tag) => tag.trim()));
    },
  };
};
