import { Locator, Page } from '@playwright/test';
import { PageObject, LocatorFactory, ExposedPageObject } from '../';

export class Webpage implements Page{
  // protected page(): Page {
  //   throw new Error('Method not implemented.');
  // }
  // get element(): Page | Locator {
  //   throw new Error('Method not implemented.');
  // }
  // #page: Page;
  // constructor(page: Page) {
  //   super();
  //   this.#page = page;
  // }
  // protected get parent(): ExposedPageObject {
  //   throw new Error('Method not implemented.');
  // }
  //  find = (locator: LocatorFactory) => {
  //   return locator(this.#page);
  // };

}

class Foo implements Page {

}
const x: Foo