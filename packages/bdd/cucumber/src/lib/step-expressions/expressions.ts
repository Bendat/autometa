import {
  CucumberExpression,
  ParameterTypeRegistry,
} from '@cucumber/cucumber-expressions';
import { PreparedStepGroup } from '../types';

export type ExpressionMatch = {
  expression: string;
  args: readonly (string | number | unknown)[];
};

export function findMatchingExpression(
  text: string,
  group: PreparedStepGroup
): ExpressionMatch | null {
  for (const stepName in group) {
    const cucumberExpression = new CucumberExpression(
      stepName,
      new ParameterTypeRegistry()
    );
    const match = cucumberExpression.match(text);
    if (match) {
      const args: unknown[] = match.map((res) =>
        res.parameterType.transform(res, [res.group.value, ...res.group.value])
      );
      return { expression: stepName, args };
    }
  }
  return null;
}

