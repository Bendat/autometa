import { PageObject } from '@autometa/page-components';
import { constructor } from 'tsyringe/dist/typings/types';
import { Observation } from './observation';

export class Action<T extends PageObject, K extends PageObject> {
  readonly observing: Observation<T, K>;
  constructor(
    on: constructor<T> | Observation<T, K>,
    public readonly action: (item: K) => unknown | Promise<unknown>
  ) {
    if (on instanceof Observation) {
      this.observing = on;
    } else {
      this.observing = new Observation(on, (page) => page as unknown as K);
    }
  }
}

export function ActionOn<T extends PageObject, K extends PageObject>(
  on: constructor<T> | Observation<T, K>,
  action: (page: K) => unknown | Promise<unknown>
): Action<T, K> {
  return new Action(on, action);
}

export const Click = <T extends { click: () => Promise<void> }>({
  click,
}: T) => click();
export const Text = <T extends { text: () => Promise<void> }>({ text }: T) =>
  text;
