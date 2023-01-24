import { PreparedStepGroup, StepData } from '../types';
import { findMatchingExpression } from './expressions';

describe('findMatchingExpression', () => {
  it('should match an expression', () => {
    const stepExpression = 'a {word} step';
    const group = {
      __keyword__: 'Given',
      [stepExpression]: new StepData('a {word} step', undefined, jest.fn(), false),
    };

    const { expression, args } = findMatchingExpression(
      'a giant step',
      group as unknown as PreparedStepGroup
    );
    const [argument] = args;
    expect(expression).toBe(stepExpression);
    expect(argument).toBe('giant');
  });
});
