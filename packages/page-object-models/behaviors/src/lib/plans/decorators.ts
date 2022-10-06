import { Component, PageObject, WebPage } from '@autometa/page-components';
import { constructor } from 'tsyringe/dist/typings/types';
import {
  Action,
  AssertionFn,
  Observation,
  Thought,
  ThoughtAbout,
  ThoughtFor,
} from '../behaviors';
import { Switcher, WindowContext } from '../subplot';
import { Plans } from './plans';
export class ActionMetadata {
  readonly userAction = 'will';

  constructor(
    public readonly key: string,
    public readonly action: Action<PageObject, Component>
  ) {}
}
export class ObservationMetadata {
  readonly userAction = 'see';
  constructor(
    public readonly key: string,
    public readonly observer:
      | constructor<WebPage>
      | Observation<PageObject, unknown>,
    public readonly assertion: AssertionFn
  ) {}
}
export class ThoughtMetadata {
  readonly userAction = 'think';
  constructor(
    public readonly key: string,
    public readonly condition: Thought,
    public readonly reason: string
  ) {}
}
export interface PlanMetaStructure {
  subPlans: {
    procedures: { key: string; type: constructor<unknown> }[];
    agendas: { key: string; type: constructor<unknown> }[];
  };
  steps: (ActionMetadata | ObservationMetadata | ThoughtMetadata)[];
}

const emptyStructure = (): PlanMetaStructure => {
  return {
    subPlans: {
      procedures: [],
      agendas: [],
    },
    steps: [],
  };
};
export function agenda<T extends Plans>(
  plans: constructor<T>
): PropertyDecorator {
  return (target, key): void => {
    withMetaStructure(target, (structure) =>
      structure.subPlans.agendas.push({ key: String(key), type: plans })
    );
  };
}

function withMetaStructure(
  target: unknown,
  action: (struct: PlanMetaStructure) => unknown
) {
  const structure: PlanMetaStructure = Reflect.getMetadata(
    'plan-structure',
    target.constructor
  );
  const actualStructure = structure ?? emptyStructure();
  action(actualStructure);
  if (!Reflect.hasMetadata('plan-structure', target.constructor)) {
    Reflect.defineMetadata(
      'plan-structure',
      actualStructure,
      target.constructor
    );
  }
}

export function procedure<T extends Plans>(
  plans: constructor<T>
): PropertyDecorator {
  return (target, key): void => {
    withMetaStructure(target, (structure) =>
      structure.subPlans.procedures.push({ key: String(key), type: plans })
    );
  };
}

export function action(
  ...args: Action<PageObject, Component>[]
): PropertyDecorator {
  return (target, key): void => {
    withMetaStructure(target, (structure) =>
      args.map((arg) =>
        structure.steps.push(new ActionMetadata(String(key), arg))
      )
    );
  };
}

export function observation<T extends PageObject, K>(
  observer: constructor<WebPage> | Observation<T, K>,
  assertion: AssertionFn
): PropertyDecorator {
  return (target, key): void => {
    withMetaStructure(target, (structure) =>
      structure.steps.push(
        new ObservationMetadata(String(key), observer, assertion)
      )
    );
  };
}

export function thought(condition: Thought, reason: string): PropertyDecorator {
  return (target, key): void => {
    withMetaStructure(target, (structure) =>
      structure.steps.push(new ThoughtMetadata(String(key), condition, reason))
    );
  };
}

export function toStartAsSubplot(
  windowType: WindowContext
): ClassDecorator {
  return (target): void => {
    // withMetaStructure(target, (structure) =>
    //   structure.steps.push(new ThoughtMetadata(String(key), condition, reason))
    // );
  };
}
export function which(
  then: Switcher, name: string
): ClassDecorator {
  return (target): void => {
    // withMetaStructure(target, (structure) =>
    //   structure.steps.push(new ThoughtMetadata(String(key), condition, reason))
    // );
  };
}
