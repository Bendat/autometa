import { PageObject, WebPage, Website } from '@autometa/page-components';
import { Component } from 'react';
import { constructor } from 'tsyringe/dist/typings/types';

export class Observation<T extends PageObject, K> {
  constructor(
    public readonly type: constructor<T> | Observation<PageObject, T>,
    public readonly selector: (item: T) => K | Promise<K>
  ) {}

  async select(site: Website) {
    const type = this.type;
    if (type instanceof Observation) {
      const innerType: constructor<PageObject> = (await type.select(
        site
      )) as unknown as constructor<WebPage>;
      if (innerType instanceof PageObject) {
        return this.selector(innerType as any);
      }
      const inst = new innerType();
      if (inst instanceof WebPage) {
        const page = site.switch(innerType as unknown as constructor<WebPage>);
        return this.selector(page as unknown as T);
      }
      throw new Error(`Unrecognized type '${innerType}'`);
    }
    const page = site.switch(type as any);
    const selected = this.selector(page as any);
    return selected;
  }
}

/** todo allow nested/composed observers */
export function Observe<T extends PageObject, K>(
  type: constructor<T> | Observation<PageObject, T>,
  selector: (page: T) => K | Promise<K>
): Observation<T, K> {
  return new Observation(type, selector);
}

