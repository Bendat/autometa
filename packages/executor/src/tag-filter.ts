import parseTagExpressionModule from "@cucumber/tag-expressions";

export interface TagFilter {
  evaluate(tags: readonly string[]): boolean;
}

const ALWAYS_TRUE: TagFilter = {
  evaluate: () => true,
};

interface TagExpressionNode {
  evaluate(variables: string[]): boolean;
}

type ParseTagExpression = (expression: string) => TagExpressionNode;

let cachedParseFunction: ParseTagExpression | undefined;

const resolveParseFunction = (): ParseTagExpression => {
  if (cachedParseFunction) {
    return cachedParseFunction;
  }

  const moduleExport = parseTagExpressionModule as unknown;

  if (typeof moduleExport === "function") {
    cachedParseFunction = moduleExport as ParseTagExpression;
    return cachedParseFunction;
  }

  const defaultExport = (moduleExport as { default?: unknown }).default;
  if (typeof defaultExport === "function") {
    cachedParseFunction = defaultExport as ParseTagExpression;
    return cachedParseFunction;
  }

  throw new Error(
    "Unable to resolve tag expression parser from @cucumber/tag-expressions"
  );
};

const parseExpression = (expression: string) => resolveParseFunction()(expression);

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
