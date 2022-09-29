import { Component, PageObject, WebPage } from '@autometa/page-components';
import { constructor } from 'tsyringe/dist/typings/types';
import {
  Action,
  AssertionFn,
  Observer,
  Thought,
  ThoughtAbout,
  ThoughtFor,
} from '../behaviors';
import { Plans } from './plans';

export interface PlanMetaStructure {
  subPlans: {
    procedures: { key: string; type: constructor<unknown> }[];
    agendas: { key: string; type: constructor<unknown> }[];
  };
  steps: {
    actions: { key: string; action: Action<PageObject> }[];
    observations: {
      key: string;
      observer: Observer<PageObject, unknown>;
      assertion: AssertionFn;
    }[];
    thoughts: { key: string; condition: Thought; reason: string }[];
  };
}
const emptyStructure = (): PlanMetaStructure => {
  return {
    subPlans: {
      procedures: [],
      agendas: [],
    },
    steps: {
      actions: [],
      observations: [],
      thoughts: [],
    },
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
  const structure: PlanMetaStructure =
    Reflect.getMetadata(target.constructor, 'plan-structure') ??
    emptyStructure();
  action(structure);
  if (!Reflect.hasMetadata(target.constructor, 'plan-structure')) {
    Reflect.defineMetadata('plan-structure', structure, target.constructor);
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

export function action(...args: Action<PageObject, Component>[]): PropertyDecorator {
  return (target, key): void => {
    withMetaStructure(target, (structure) =>
      args.map((arg) =>
        structure.steps.actions.push({ key: String(key), action: arg })
      )
    );
  };
}

export function observation<T extends WebPage, K extends Component>(
  observer: Observer<T, K>,
  assertion: AssertionFn
): PropertyDecorator {
  return (target, key): void => {
    withMetaStructure(target, (structure) =>
      structure.steps.observations.push({
        key: String(key),
        observer,
        assertion,
      })
    );
  };
}

export function thought(condition: Thought, reason: string): PropertyDecorator {
  return (target, key): void => {
    withMetaStructure(target, (structure) =>
      structure.steps.thoughts.push({
        key: String(key),
        condition,
        reason,
      })
    );
  };
}
