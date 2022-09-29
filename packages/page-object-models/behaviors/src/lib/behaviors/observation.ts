import { PageObject, WebPage } from '@autometa/page-components';
import { constructor } from 'tsyringe/dist/typings/types';

export class Observer<T extends PageObject, K> {
  constructor(
    public readonly type: constructor<T>,
    public readonly selector: (item: T) => K | Promise<K>
  ) {}
}

/** todo allow nested/composed observers */
export function Observe<T extends WebPage, K>(
  type: constructor<T>,
  selector: (page: T) => K | Promise<K>
): Observer<T, K> {
  return new Observer(type, selector);
}
