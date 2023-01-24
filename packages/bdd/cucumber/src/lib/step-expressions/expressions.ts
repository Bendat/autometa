import {
  CucumberExpression,
  ParameterTypeRegistry,
} from '@cucumber/cucumber-expressions';
import { DependencyContainer, InjectionToken } from 'tsyringe';
import { globalCache } from '../step-definition-builders/global-steps/global-step-cache';
import {
  DecoratedStepBlueprint,
  StepMetaDataKey,
} from '../step-definition-builders/global-steps/meta-types';
import { PreparedStepCallback, PreparedStepGroup, StepData } from '../types';

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

export function findMatchingGlobalExpression(text: string) {
  const { Given, When, Then } = globalCache;
  const steps = [...Given, ...When, ...Then];
  for (const step of steps) {
    const cucumberExpression = new CucumberExpression(
      step.text,
      new ParameterTypeRegistry()
    );

    const match = cucumberExpression.match(text);
    if (match) {
      const args: unknown[] = match.map((res) =>
        res.parameterType.transform(res, [res.group.value, ...res.group.value])
      );
      // return new StepData(step.text, null, step.action, )
      return { step, args };
    }
  }

  return null;
}

export function findMatchingGlobalTargetExpression(
  text: string,
  container: DependencyContainer
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const targets = globalCache.Targets as Set<any>;
  const instanceSteps: StepData[] = [];
  for (const target of targets) {
    if (!container.isRegistered(target)) {
      container.register(target, target.constructor);
    }

    const instance = container.resolve(
      target as unknown as InjectionToken<unknown>
    );

    const steps: DecoratedStepBlueprint[] = Reflect.getMetadata(
      StepMetaDataKey,
      target
    );
    for (const { propertyKey, stepText } of steps) {
      const action: PreparedStepCallback = instance[propertyKey];
      action.bind(instance);
      instanceSteps.push(new StepData(stepText, null, action, false));
    }
  }
  
  for (const step of instanceSteps) {
    const cucumberExpression = new CucumberExpression(
      step.text,
      new ParameterTypeRegistry()
    );

    const match = cucumberExpression.match(text);
    if (match) {
      const args: unknown[] = match.map((res) =>
        res.parameterType.transform(res, [res.group.value, ...res.group.value])
      );
      return { step, args };
    }
  }

  return null;
}
