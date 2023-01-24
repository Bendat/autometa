import { WebPage } from '@autometa/page-components';
import {
  FrameLocator,
  Locator,
  LocatorScreenshotOptions,
  Page,
} from '@playwright/test';
import { GetByRoleOptions, LocatorFactory, Role } from '../';
import { FilterOptions, FindByTextOptions, Options } from './types';
export interface ExposedPageObject {
  get page(): Page;
  get parent(): PageObject;
  find(locator: LocatorFactory);
}
export abstract class PageObject {
  protected _parent: ExposedPageObject = this as unknown as ExposedPageObject;

  protected abstract page(): Page;
  //   protected abstract get parent(): ExposedPageObject;
  //   protected abstract find(locator: LocatorFactory): Locator;

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

  find = (locator: LocatorFactory) => locator(this.element);

  abstract get element(): Locator | Page 
//     if (this instanceof WebPage) {
//       return this.page();
//     }
//     return this.parent.find(this.#locatorFactory);
//   }

  get $(): Locator  | Page{
    return this.element;
  }

  //   all = (): Promise<Locator[]> => this.element.all();

  //   blur = (options?: Options): Promise<void> => this.element.blur(options);

  //   boundingBox = (
  //     options?: Options
  //   ): Promise<{ x: number; y: number; width: number; height: number }> =>
  //     this.element.boundingBox(options);

  //   count = (): Promise<number> => this.element.count();

  //   dblclick = (options?: DoubleClickOptions): Promise<void> =>
  //     this.element.dblclick(options);
  //   dragTo = (target: Locator, options?: DragToOptions): Promise<void> =>
  //     this.element.dragTo(target, options);

  //   elementHandles = (): Promise<ElementHandle<unknown>[]> =>
  //     this.element.elementHandles();

  //   filter = (options?: { has?: Locator; hasText?: string | RegExp }): Locator =>
  //     this.element.filter(options);

  //   first = (): Locator => this.element.first();

  //   focus = (options?: Options): Promise<void> => this.element.focus(options);
  //   scrollIntoViewIfNeeded = (options?: Options): Promise<void> =>
  //     this.element.scrollIntoViewIfNeeded(options);

  //   waitFor = (options?: WaitForOptions): Promise<void> =>
  //     this.element.waitFor(options);
  //   type = (text: string, options?: TypeOptions): Promise<void> =>
  //     this.element.type(text, options);


  //   highlight = (): Promise<void> => this.element.highlight();

  //   hover = (options?: HoverOptions): Promise<void> =>
  //     this.element.hover(options);

  //   innerHTML = (options?: Options): Promise<string> =>
  //     this.element.innerHTML(options);

  //   innerText = (options?: Options): Promise<string> =>
  //     this.element.innerText(options);

  //   inputValue = (options?: Options): Promise<string> =>
  //     this.element.inputValue(options);

  //   isChecked = (options?: Options): Promise<boolean> =>
  //     this.element.isChecked(options);

  //   isDisabled = (options?: Options): Promise<boolean> =>
  //     this.element.isDisabled(options);

  //   isEditable = (options?: Options): Promise<boolean> =>
  //     this.element.isEditable(options);

  //   isEnabled = (options?: Options): Promise<boolean> =>
  //     this.element.isEnabled(options);

  //   isHidden = (options?: Options): Promise<boolean> =>
  //     this.element.isHidden(options);

  //   isVisible = (options?: Options): Promise<boolean> =>
  //     this.element.isVisible(options);

  //   last = (): Locator => this.element.last();
  //   nth = (index: number): Locator => this.element.nth(index);

  //   selectOption = <T>(
  //     values:
  //       | string
  //       | string[]
  //       | ElementHandle<T>
  //       | ElementHandle<T>[]
  //       | { value?: string; label?: string; index?: number }
  //       | { value?: string; label?: string; index?: number }[],
  //     options?: LocatorOptions
  //   ): Promise<string[]> => this.element.selectOption(values, options);

  //   selectText = (options?: {
  //     force?: boolean;
  //     timeout?: number;
  //   }): Promise<void> => this.element.selectText(options);

  //   setChecked = (checked: boolean, options?: SetCheckedOptions): Promise<void> =>
  //     this.element.setChecked(checked, options);

  //   setInputFiles = (
  //     files: SetFileArgs,
  //     options?: { noWaitAfter?: boolean; timeout?: number }
  //   ): Promise<void> => this.element.setInputFiles(files, options);
 
}
