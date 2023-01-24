import { Component } from '@autometa/page-components';
import {
  LocatorScreenshotOptions,
  Locator,
  type Page,
  ElementHandle,
  FrameLocator,
  JSHandle,
} from '@playwright/test';
import { By, GetByRoleOptions, Role, type LocatorFactory } from '../locator';
import { type ExposedPageObject, PageObject } from './page-object';
import {
  type FillOptions,
  type ClickOptions,
  TapOptions,
  PressOptions,
  CheckOptions,
  LocatorOptions,
  EventOptions,
  Options,
  DoubleClickOptions,
  DragToOptions,
  TypeOptions,
  FilterOptions,
  SetCheckedOptions,
  SetFileArgs,
  FindByTextOptions,
  HoverOptions,
  WaitForOptions,
  ButtonLikeOption,
} from './types';
export interface PageComponentOptions<T extends PageComponent = PageComponent> {
  locator?: Locator;
  locatorFactory?: (root: Page | Locator) => Locator;
  parent?: T;
  page?: Page;
}
// function Locate(arg0: LocatorFactory) {
//     return (cls: any) => {

//         // return class
//     }
// }

// function Component(by: LocatorFactory){
//     return (target, key){
//         ca
//     }
// }

// function getOrCreateCache(target, key){
//    return  Reflect.getMetadata('page-component:properties:cache',target, key) ?? {}

// }
// @Locate(By.altText(''))
export class PageComponent implements Locator {
  #parent: PageComponent;
  #locator: Locator;
  #defaultOptions: {
    fillOptions?: FillOptions;
  };
  constructor(options: PageComponentOptions) {
    this.#parent = options.parent;
    this.#locator = options.locator;

    const locatorFactory = options.locatorFactory;
    const page = options.page;
    const defaultFactory = Reflect.getMetadata(
      'page-components:locator:default',
      this.constructor
    );
    if (page && locatorFactory) {
      if (locatorFactory) {
        this.#locator = locatorFactory(this.#parent ?? page);
      } else if (defaultFactory) {
        this.#locator = defaultFactory(this.#parent ?? page);
      }
    }
    if (!this.#locator) {
      throw new Error(`Cannot create a PageComponent without a valid locator.`);
    }
  }

  //   @Component(By.label(''))
  //   loginModal: PageComponent
  //   @Component('body')
  //   otherModal: PageComponent
  //   protected _parent: ExposedPageObject = this as unknown as ExposedPageObject;

  get element(): Locator {
    return this.#locator;
  }
  get $(): Locator {
    return this.element;
  }
  find = (locator: LocatorFactory) => locator(this.element);

  frameLocator = (selector: string): FrameLocator =>
    this.element.frameLocator(selector);

  getByAltText = (
    text: string | RegExp,
    options?: FindByTextOptions
  ): Locator => this.element.getByAltText(text, options);

  getByLabel = (text: string | RegExp, options?: FindByTextOptions): Locator =>
    this.element.getByAltText(text, options);

  getByPlaceholder = (
    text: string | RegExp,
    options?: FindByTextOptions
  ): Locator => this.getByPlaceholder(text, options);

  getByRole = (role: Role, options?: GetByRoleOptions): Locator =>
    this.element.getByRole(role, options);

  getByTestId = (testId: string | RegExp): Locator =>
    this.element.getByTestId(testId);

  getByText = (text: string | RegExp, options?: FindByTextOptions): Locator =>
    this.element.getByText(text, options);

  getByTitle = (text: string | RegExp, options?: FindByTextOptions): Locator =>
    this.element.getByTitle(text, options);

  locator = (selector: string, options?: FilterOptions): Locator =>
    this.element.locator(selector, options);

  textContent = (options?: Options): Promise<string> =>
    this.textContent(options);

  screenshot = (options?: LocatorScreenshotOptions) =>
    this.element.screenshot(options);

  page(): Page {
    return this.element.page();
  }

  dispatchEvent = (
    type: string,
    eventInit?: Record<string, unknown>,
    options?: EventOptions
  ): Promise<void> => this.element.dispatchEvent(type, eventInit, options);

  evaluateHandle = (
    pageFunction: (...args: unknown[]) => unknown | string,
    arg?: Record<string, unknown>,
    options?: Options
  ): Promise<JSHandle> =>
    this.element.evaluateHandle(pageFunction, arg, options);

  evaluate = <R>(
    pageFunction: (...args) => R,
    arg?: unknown,
    options?: EventOptions
  ): Promise<R> => this.element.evaluate(pageFunction, arg, options);

  evaluateAll = <R>(
    pageFunction: (...args: unknown[]) => R,
    arg?: unknown
  ): Promise<R> => this.element.evaluateAll(pageFunction, arg);

  elementHandle = (options?: Options): Promise<ElementHandle<unknown>> =>
    this.element.elementHandle(options);

  getAttribute = (name: string, options?: Options): Promise<string> =>
    this.element.getAttribute(name, options);

  all = (): Promise<Locator[]> => this.element.all();

  blur = (options?: Options): Promise<void> => this.element.blur(options);

  boundingBox = (
    options?: Options
  ): Promise<{ x: number; y: number; width: number; height: number }> =>
    this.element.boundingBox(options);

  count = (): Promise<number> => this.element.count();

  dblclick = (options?: DoubleClickOptions): Promise<void> =>
    this.element.dblclick(options);

  dragTo = (target: Locator, options?: DragToOptions): Promise<void> =>
    this.element.dragTo(target, options);

  elementHandles = (): Promise<ElementHandle<unknown>[]> =>
    this.element.elementHandles();

  filter = (options?: { has?: Locator; hasText?: string | RegExp }): Locator =>
    this.element.filter(options);

  first = (): Locator => this.element.first();

  focus = (options?: Options): Promise<void> => this.element.focus(options);

  highlight = (): Promise<void> => this.element.highlight();

  hover = (options?: HoverOptions): Promise<void> =>
    this.element.hover(options);

  innerHTML = (options?: Options): Promise<string> =>
    this.element.innerHTML(options);

  innerText = (options?: Options): Promise<string> =>
    this.element.innerText(options);

  inputValue = (options?: Options): Promise<string> =>
    this.element.inputValue(options);

  isChecked = (options?: Options): Promise<boolean> =>
    this.element.isChecked(options);

  isDisabled = (options?: Options): Promise<boolean> =>
    this.element.isDisabled(options);

  isEditable = (options?: Options): Promise<boolean> =>
    this.element.isEditable(options);

  isEnabled = (options?: Options): Promise<boolean> =>
    this.element.isEnabled(options);

  isHidden = (options?: Options): Promise<boolean> =>
    this.element.isHidden(options);

  isVisible = (options?: Options): Promise<boolean> =>
    this.element.isVisible(options);

  last = (): Locator => this.element.last();

  nth = (index: number): Locator => this.element.nth(index);

  scrollIntoViewIfNeeded = (options?: Options): Promise<void> =>
    this.element.scrollIntoViewIfNeeded(options);

  selectOption = <T>(
    values:
      | string
      | string[]
      | ElementHandle<T>
      | ElementHandle<T>[]
      | { value?: string; label?: string; index?: number }
      | { value?: string; label?: string; index?: number }[],
    options?: LocatorOptions
  ): Promise<string[]> => this.element.selectOption(values, options);

  selectText = (options?: {
    force?: boolean;
    timeout?: number;
  }): Promise<void> => this.element.selectText(options);

  setChecked = (checked: boolean, options?: SetCheckedOptions): Promise<void> =>
    this.element.setChecked(checked, options);

  setInputFiles = (
    files: SetFileArgs,
    options?: { noWaitAfter?: boolean; timeout?: number }
  ): Promise<void> => this.element.setInputFiles(files, options);

  type = (text: string, options?: TypeOptions): Promise<void> =>
    this.element.type(text, options);

  waitFor = (options?: WaitForOptions): Promise<void> =>
    this.element.waitFor(options);

  fill = (text: string, options: FillOptions) =>
    this.element.fill(text, options);

  click = (options?: ClickOptions) => this.element.click(options);

  tap = (options?: TapOptions) => this.element.tap(options);

  press = (key: string, options?: PressOptions) =>
    this.element.press(key, options);

  allInnerTexts = () => this.element.allInnerTexts();

  allTextContents = () => this.element.allTextContents();

  check = (options?: CheckOptions) => this.element.check(options);

  uncheck = (options?: CheckOptions) => this.element.uncheck(options);

  clear = (options?: LocatorOptions) => this.element.clear(options);
}
