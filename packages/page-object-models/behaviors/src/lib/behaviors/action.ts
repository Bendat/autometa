import { Component, PageObject, WebPage } from '@autometa/page-components';
import { constructor } from 'tsyringe/dist/typings/types';
import { Observer } from './observation';

export class Action<T extends PageObject, K extends PageObject> {
  constructor(
    public readonly on: Observer<T, T|K>,
    public readonly action: (item: K) => unknown | Promise<unknown>
  ) {}

  get targetName() {
    return this.on.type.name;
  }
}

export function ActionOn<T extends PageObject, K extends Component>(
  on: Observer<T, K>,
  action: (page: K) => unknown | Promise<unknown>
): Action<T, K> {
  return new Action(on, action);
}

export function ActionFrom<T extends PageObject, K extends PageObject>(
  on: constructor<T>,
  action: (page: T) => unknown | Promise<unknown>
): Action<T, K> {
  const observer = new Observer(on, (page) => page);
  return new Action(observer as any, action as any);
}
