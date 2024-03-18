import { Class } from "@autometa/shared";
import {
  ElementHandle,
  FrameLocator,
  JSHandle,
  Locator,
  LocatorScreenshotOptions,
  Page,
  expect,
} from "@playwright/test";
import { PageComponent, PageFunctionOn } from ".";
import { LocatorFactory, Role, GetByRoleOptions } from "../locator";
import { Component } from "./component";
import {
  DecoratedProperty,
  getOrCreatePropertyList,
  locatorMetakey,
} from "./decorators";

import {
  FindByTextOptions,
  EventOptions,
  DoubleClickOptions,
  DragToOptions,
  HoverOptions,
  LocatorOptions,
  SetCheckedOptions,
  SetFileArgs,
  TypeOptions,
  WaitForOptions,
  FillOptions,
  ClickOptions,
  TapOptions,
  PressOptions,
  CheckOptions,
  Options,
  RoleOptions,
} from "./locator-options";
import {
  GetByAltTextOverloads,
  GetByLabelOverloads,
  GetByLocatorOverloads,
  GetByPlaceholderOverloads,
  GetByRoleOverloads,
  GetByTestIdOverloads,
  GetByTextOverloads,
  TransformLocator,
} from "./overloads";
import { PageComponentOptions } from "./types";
type EvaluationArgument = {};
export type FallbackType<T extends SemanticComponent> = Class<T>;
export class SemanticComponent {
  #locator!: Locator;
  protected fallbackType: FallbackType<SemanticComponent> =
    SemanticComponent as Class<SemanticComponent>;

  constructor(options: PageComponentOptions<SemanticComponent>) {
    if (options.locator) {
      this.#locator = options.locator;
    }
  }
  get expect(): ReturnType<typeof expect<Locator>> {
    return expect<Locator>(this.$);
  }

  static browse<T extends Component>(blueprint: Class<T>, locator: Locator): T {
    const options: PageComponentOptions<Component> = { locator };
    const root = new blueprint(options);
    const children: DecoratedProperty<Component>[] = getOrCreatePropertyList(
      blueprint.prototype
    );
    const self = root as unknown as Record<string, unknown>;
    const childInstances = createChildComponents(blueprint, locator, children);
    for (const cc of childInstances) {
      self[cc[0] as string] = cc[1];
    }
    return root;
  }
  get element(): Locator {
    return this.#locator;
  }
  get $(): Locator {
    return this.element;
  }

  /**
   * {@link Locator#find | Find}
   */
  protected find = (locator: LocatorFactory) => locator(this.element);

  protected frameLocator: Locator["frameLocator"] = (
    selector: string
  ): FrameLocator => this.element.frameLocator(selector);

  protected getByAltText: GetByAltTextOverloads<SemanticComponent> = <
    T extends SemanticComponent = SemanticComponent
  >(
    selector: string | RegExp,
    options?: FindByTextOptions | Class<T>,
    type?: Class<T>
  ): T =>
    this.transformLocator(this.element.getByAltText, selector, options, type);
  protected transformLocator: TransformLocator<SemanticComponent> = <
    T extends SemanticComponent,
    K extends Options = Options
  >(
    locator: (...args: any[]) => Locator,
    selector: string | RegExp,
    options?: K | Class<T>,
    type?: Class<T>
  ): T => {
    let classType = this.fallbackType;
    let optionsObject: FindByTextOptions | undefined;
    if (
      options &&
      Reflect.get(options, "prototype") instanceof SemanticComponent
    ) {
      classType = options as Class<SemanticComponent>;
      optionsObject = undefined;
    }
    if (type?.prototype instanceof SemanticComponent) {
      classType = type;
      optionsObject = options as FindByTextOptions;
    }
    return SemanticComponent.browse(
      classType,
      locator(selector, options as FindByTextOptions)
    ) as T;
  };
  protected getByLabel: GetByLabelOverloads<SemanticComponent> = <
    T extends SemanticComponent = SemanticComponent
  >(
    selector: string | RegExp,
    options?: FindByTextOptions | Class<T>,
    type?: Class<T>
  ): T =>
    this.transformLocator(this.element.getByLabel, selector, options, type);

  protected getByPlaceholder: GetByPlaceholderOverloads<PageComponent> = <
    T extends SemanticComponent = SemanticComponent
  >(
    text: string | RegExp,
    options?: FindByTextOptions | Class<T>,
    type?: Class<T>
  ): T =>
    this.transformLocator(this.element.getByPlaceholder, text, options, type);

  protected getByRole: GetByRoleOverloads<SemanticComponent> = <
    T extends SemanticComponent = SemanticComponent
  >(
    role: Role,
    options?: RoleOptions | Class<T>,
    type?: Class<T>
  ): T => this.transformLocator(this.element.getByRole, role, options, type);

  protected getByTestId: GetByTestIdOverloads<SemanticComponent> = <
    T extends SemanticComponent = SemanticComponent
  >(
    testId: string | RegExp,
    type?: Class<T>
  ): T =>
    this.transformLocator(this.element.getByTestId, testId, undefined, type);

  protected getByText: GetByTextOverloads<SemanticComponent> = <
    T extends SemanticComponent = SemanticComponent
  >(
    text: string | RegExp,
    options?: FindByTextOptions | Class<T>,
    type?: Class<T>
  ): T => this.transformLocator(this.element.getByText, text, options, type);

  protected getByTitle = <T extends SemanticComponent = SemanticComponent>(
    text: string | RegExp,
    options?: FindByTextOptions | Class<T>,
    type?: Class<T>
  ): T => this.transformLocator(this.element.getByTitle, text, options, type);

  protected locator: GetByLocatorOverloads<SemanticComponent> = <
    T extends SemanticComponent = SemanticComponent
  >(
    selector: string,
    options?: LocatorOptions | Class<T>,
    type?: Class<T>
  ): T => this.transformLocator(this.element.locator, selector, options, type);
  /**
   * Returns the [`node.textContent`](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent).
   * @param options
   */
  protected textContent = (options?: Options): Promise<string | null> =>
    this.element.textContent(options);
  /**
   * Take a screenshot of the element matching the locator.
   *
   * **Usage**
   *
   * ```js
   * await page.getByRole('link').screenshot();
   * ```
   *
   * Disable animations and save screenshot to a file:
   *
   * ```js
   * await page.getByRole('link').screenshot({ animations: 'disabled', path: 'link.png' });
   * ```
   *
   * **Details**
   *
   * This method captures a screenshot of the page, clipped to the size and position of a particular element matching
   * the locator. If the element is covered by other elements, it will not be actually visible on the screenshot. If the
   * element is a scrollable container, only the currently scrolled content will be visible on the screenshot.
   *
   * This method waits for the [actionability](https://playwright.dev/docs/actionability) checks, then scrolls element into view before taking
   * a screenshot. If the element is detached from DOM, the method throws an error.
   *
   * Returns the buffer with the captured screenshot.
   * @param options
   */
  screenshot = (options?: LocatorScreenshotOptions) =>
    this.element.screenshot(options);

  /**
   * A Page this component belongs to
   * @returns The page which owns this component
   */
  page = (): Page => {
    return this.element.page();
  };

  protected dispatchEvent = (
    type: string,
    eventInit?: Record<string, unknown>,
    options?: EventOptions
  ): Promise<void> => this.element.dispatchEvent(type, eventInit, options);

  protected evaluateHandle = (
    pageFunction: (...args: unknown[]) => unknown | string,
    arg?: EvaluationArgument,
    options?: Options
  ): Promise<JSHandle> =>
    this.element.evaluateHandle(pageFunction, arg, options);
  /**
   * Execute JavaScript code in the page, taking the matching element as an argument.
   *
   * **Details**
   *
   * Returns the return value of `pageFunction`, called with the matching element as a first argument, and `arg` as a
   * second argument.
   *
   * If `pageFunction` returns a [Promise], this method will wait for the promise to resolve and return its value.
   *
   * If `pageFunction` throws or rejects, this method throws.
   *
   * **Usage**
   *
   * ```js
   * const tweets = page.locator('.tweet .retweets');
   * expect(await tweets.evaluate(node => node.innerText)).toBe('10 retweets');
   * ```
   *
   * @param pageFunction Function to be evaluated in the page context.
   * @param arg Optional argument to pass to `pageFunction`.
   * @param options
   */
  protected evaluate = <
    R,
    Arg,
    E extends SVGElement | HTMLElement = SVGElement | HTMLElement
  >(
    pageFunction: PageFunctionOn<E, Arg, R>,
    arg?: EvaluationArgument,
    options?: EventOptions
  ): Promise<R> => this.element.evaluate(pageFunction as any, arg, options);

  /**
   * Execute JavaScript code in the page, taking all matching elements as an argument.
   *
   * **Details**
   *
   * Returns the return value of `pageFunction`, called with an array of all matching elements as a first argument, and
   * `arg` as a second argument.
   *
   * If `pageFunction` returns a [Promise], this method will wait for the promise to resolve and return its value.
   *
   * If `pageFunction` throws or rejects, this method throws.
   *
   * **Usage**
   *
   * ```js
   * const locator = page.locator('div');
   * const moreThanTen = await locator.evaluateAll((divs, min) => divs.length > min, 10);
   * ```
   *
   * @param pageFunction Function to be evaluated in the page context.
   * @param arg Optional argument to pass to `pageFunction`.
   */
  protected evaluateAll = <
    R,
    Arg,
    E extends SVGElement | HTMLElement = SVGElement | HTMLElement
  >(
    pageFunction: PageFunctionOn<E[], Arg, R>,
    arg?: Arg
  ): Promise<R> => this.element.evaluateAll(pageFunction as any, arg);

  /**
   * Execute JavaScript code in the page, taking all matching elements as an argument.
   *
   * **Details**
   *
   * Returns the return value of `pageFunction`, called with an array of all matching elements as a first argument, and
   * `arg` as a second argument.
   *
   * If `pageFunction` returns a [Promise], this method will wait for the promise to resolve and return its value.
   *
   * If `pageFunction` throws or rejects, this method throws.
   *
   * **Usage**
   *
   * ```js
   * const locator = page.locator('div');
   * const moreThanTen = await locator.evaluateAll((divs, min) => divs.length > min, 10);
   * ```
   *
   * @param pageFunction Function to be evaluated in the page context.
   * @param arg Optional argument to pass to `pageFunction`.
   */
  protected elementHandle = (
    options?: Options
  ): Promise<null | ElementHandle<SVGElement | HTMLElement>> =>
    this.element.elementHandle(options);

  /**
   * Returns the matching element's attribute value.
   * @param name Attribute name to get the value for.
   * @param options
   */
  getAttribute = (name: string, options?: Options): Promise<string | null> =>
    this.element.getAttribute(name, options);
  /**
   * When locator points to a list of elements, returns array of locators, pointing to respective elements.
   *
   * **Usage**
   *
   * ```js
   * for (const li of await page.getByRole('listitem').all())
   *   await li.click();
   * ```
   *
   */
  protected all = (): Promise<Locator[]> => this.element.all();
  /**
   * Calls [blur](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/blur) on the element.
   * @param options
   */
  protected blur = (options?: Options): Promise<void> =>
    this.element.blur(options);

  /**
   * This method returns the bounding box of the element matching the locator, or `null` if the element is not visible.
   * The bounding box is calculated relative to the main frame viewport - which is usually the same as the browser
   * window.
   *
   * **Details**
   *
   * Scrolling affects the returned bounding box, similarly to
   * [Element.getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
   * That means `x` and/or `y` may be negative.
   *
   * Elements from child frames return the bounding box relative to the main frame, unlike the
   * [Element.getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
   *
   * Assuming the page is static, it is safe to use bounding box coordinates to perform input. For example, the
   * following snippet should click the center of the element.
   *
   * **Usage**
   *
   * ```js
   * const box = await page.getByRole('button').boundingBox();
   * await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
   * ```
   *
   * @param options
   */
  protected boundingBox = (
    options?: Options
  ): Promise<{ x: number; y: number; width: number; height: number } | null> =>
    this.element.boundingBox(options);
  /**
   * Returns the number of elements matching the locator.
   *
   * **Usage**
   *
   * ```js
   * const count = await page.getByRole('listitem').count();
   * ```
   *
   */
  protected count = (): Promise<number> => this.element.count();
  /**
   * Double-click an element.
   *
   * **Details**
   *
   * This method double clicks the element by performing the following steps:
   * 1. Wait for [actionability](https://playwright.dev/docs/actionability) checks on the element, unless `force` option is set.
   * 1. Scroll the element into view if needed.
   * 1. Use [page.mouse](https://playwright.dev/docs/api/class-page#page-mouse) to double click in the center of the
   *    element, or the specified `position`.
   * 1. Wait for initiated navigations to either succeed or fail, unless `noWaitAfter` option is set. Note that if
   *    the first click of the `dblclick()` triggers a navigation event, this method will throw.
   *
   * If the element is detached from the DOM at any moment during the action, this method throws.
   *
   * When all steps combined have not finished during the specified `timeout`, this method throws a [TimeoutError].
   * Passing zero timeout disables this.
   *
   * **NOTE** `element.dblclick()` dispatches two `click` events and a single `dblclick` event.
   * @param options
   */
  protected dblclick = (options?: DoubleClickOptions): Promise<void> =>
    this.element.dblclick(options);
  /**
   * Drag the source element towards the target element and drop it.
   *
   * **Details**
   *
   * This method drags the locator to another target locator or target position. It will first move to the source
   * element, perform a `mousedown`, then move to the target element or position and perform a `mouseup`.
   *
   * **Usage**
   *
   * ```js
   * const source = page.locator('#source');
   * const target = page.locator('#target');
   *
   * await source.dragTo(target);
   * // or specify exact positions relative to the top-left corners of the elements:
   * await source.dragTo(target, {
   *   sourcePosition: { x: 34, y: 7 },
   *   targetPosition: { x: 10, y: 20 },
   * });
   * ```
   *
   * @param target Locator of the element to drag to.
   * @param options
   */
  protected dragTo = (
    target: Locator,
    options?: DragToOptions
  ): Promise<void> => this.element.dragTo(target, options);
  /**
   * **NOTE** Always prefer using [Locator]s and web assertions over [ElementHandle]s because latter are inherently racy.
   *
   * Resolves given locator to all matching DOM elements. If there are no matching elements, returns an empty list.
   */
  protected elementHandles = (): Promise<ElementHandle[]> =>
    this.element.elementHandles();
  /**
   * This method narrows existing locator according to the options, for example filters by text. It can be chained to
   * filter multiple times.
   *
   * **Usage**
   *
   * ```js
   * const rowLocator = page.locator('tr');
   * // ...
   * await rowLocator
   *     .filter({ hasText: 'text in column 1' })
   *     .filter({ has: page.getByRole('button', { name: 'column 2 button' }) })
   *     .screenshot();
   * ```
   *
   * @param options
   */
  protected filter = (options?: {
    has?: Locator;
    hasText?: string | RegExp;
  }): Locator => this.element.filter(options);
  /**
   * Returns locator to the first matching element.
   */
  protected first = (): Locator => this.element.first();
  /**
   * Calls [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the matching element.
   * @param options
   */
  protected focus = (options?: Options): Promise<void> =>
    this.element.focus(options);
  /**
   * Highlight the corresponding element(s) on the screen. Useful for debugging, don't commit the code that uses
   * [locator.highlight()](https://playwright.dev/docs/api/class-locator#locator-highlight).
   */
  protected highlight = (): Promise<void> => this.element.highlight();
  /**
   * Hover over the matching element.
   *
   * **Usage**
   *
   * ```js
   * await page.getByRole('link').hover();
   * ```
   *
   * **Details**
   *
   * This method hovers over the element by performing the following steps:
   * 1. Wait for [actionability](https://playwright.dev/docs/actionability) checks on the element, unless `force` option is set.
   * 1. Scroll the element into view if needed.
   * 1. Use [page.mouse](https://playwright.dev/docs/api/class-page#page-mouse) to hover over the center of the
   *    element, or the specified `position`.
   * 1. Wait for initiated navigations to either succeed or fail, unless `noWaitAfter` option is set.
   *
   * If the element is detached from the DOM at any moment during the action, this method throws.
   *
   * When all steps combined have not finished during the specified `timeout`, this method throws a [TimeoutError].
   * Passing zero timeout disables this.
   * @param options
   */
  protected hover = (options?: HoverOptions): Promise<void> =>
    this.element.hover(options);
  /**
   * Returns the [`element.innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML).
   * @param options
   */
  protected innerHTML = (options?: Options): Promise<string> =>
    this.element.innerHTML(options);
  /**
   * Returns the [`element.innerText`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText).
   * @param options
   */
  protected innerText = (options?: Options): Promise<string> =>
    this.element.innerText(options);
  /**
   * Returns the value for the matching `<input>` or `<textarea>` or `<select>` element.
   *
   * **Usage**
   *
   * ```js
   * const value = await page.getByRole('textbox').inputValue();
   * ```
   *
   * **Details**
   *
   * Throws elements that are not an input, textarea or a select. However, if the element is inside the `<label>`
   * element that has an associated
   * [control](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/control), returns the value of the
   * control.
   * @param options
   */
  protected inputValue = (options?: Options): Promise<string> =>
    this.element.inputValue(options);
  /**
   * Returns whether the element is checked. Throws if the element is not a checkbox or radio input.
   *
   * **Usage**
   *
   * ```js
   * const checked = await page.getByRole('checkbox').isChecked();
   * ```
   *
   * @param options
   */
  protected isChecked = (options?: Options): Promise<boolean> =>
    this.element.isChecked(options);
  /**
   * Returns whether the element is disabled, the opposite of [enabled](https://playwright.dev/docs/actionability#enabled).
   *
   * **Usage**
   *
   * ```js
   * const disabled = await page.getByRole('button').isDisabled();
   * ```
   *
   * @param options
   */
  isDisabled = (options?: Options): Promise<boolean> =>
    this.element.isDisabled(options);
  /**
   * Returns whether the element is [editable](https://playwright.dev/docs/actionability#editable).
   *
   * **Usage**
   *
   * ```js
   * const editable = await page.getByRole('textbox').isEditable();
   * ```
   *
   * @param options
   */
  protected isEditable = (options?: Options): Promise<boolean> =>
    this.element.isEditable(options);
  /**
   * Returns whether the element is [enabled](https://playwright.dev/docs/actionability#enabled).
   *
   * **Usage**
   *
   * ```js
   * const enabled = await page.getByRole('button').isEnabled();
   * ```
   *
   * @param options
   */
  isEnabled = (options?: Options): Promise<boolean> =>
    this.element.isEnabled(options);
  /**
   * @deprecated This option is ignored.
   * [locator.isHidden([options])](https://playwright.dev/docs/api/class-locator#locator-is-hidden) does not wait for
   * the element to become hidden and returns immediately.
   */
  isHidden = (options?: Options): Promise<boolean> =>
    this.element.isHidden(options);

  /**
   * Returns whether the element is [visible](https://playwright.dev/docs/actionability#visible).
   *
   * **Usage**
   *
   * ```js
   * const visible = await page.getByRole('button').isVisible();
   * ```
   *
   * @param options
   */
  isVisible = (options?: Options): Promise<boolean> =>
    this.element.isVisible(options);
  /**
   * Returns locator to the last matching element.
   *
   * **Usage**
   *
   * ```js
   * const banana = await page.getByRole('listitem').last();
   * ```
   *
   */
  protected last = (): Locator => this.element.last();
  /**
   * Returns locator to the n-th matching element. It's zero based, `nth(0)` selects the first element.
   *
   * **Usage**
   *
   * ```js
   * const banana = await page.getByRole('listitem').nth(2);
   * ```
   *
   * @param index
   */
  protected nth = (index: number): Locator => this.element.nth(index);
  /**
   * This method waits for [actionability](https://playwright.dev/docs/actionability) checks, then tries to scroll element into view, unless
   * it is completely visible as defined by
   * [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)'s `ratio`.
   * @param options
   */
  protected scrollIntoViewIfNeeded = (options?: Options): Promise<void> =>
    this.element.scrollIntoViewIfNeeded(options);
  /**
   * Selects option or options in `<select>`.
   *
   * **Details**
   *
   * This method waits for [actionability](https://playwright.dev/docs/actionability) checks, waits until all specified options are present in
   * the `<select>` element and selects these options.
   *
   * If the target element is not a `<select>` element, this method throws an error. However, if the element is inside
   * the `<label>` element that has an associated
   * [control](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/control), the control will be used
   * instead.
   *
   * Returns the array of option values that have been successfully selected.
   *
   * Triggers a `change` and `input` event once all the provided options have been selected.
   *
   * **Usage**
   *
   * ```html
   * <select multiple>
   *   <option value="red">Red</div>
   *   <option value="green">Green</div>
   *   <option value="blue">Blue</div>
   * </select>
   * ```
   *
   * ```js
   * // single selection matching the value or label
   * element.selectOption('blue');
   *
   * // single selection matching the label
   * element.selectOption({ label: 'Blue' });
   *
   * // multiple selection for red, green and blue options
   * element.selectOption(['red', 'green', 'blue']);
   * ```
   *
   * @param values Options to select. If the `<select>` has the `multiple` attribute, all matching options are selected, otherwise
   * only the first option matching one of the passed options is selected. String values are matching both values and
   * labels. Option is considered matching if all specified properties match.
   * @param options
   */
  protected selectOption = (
    values:
      | string
      | string[]
      | ElementHandle
      | ElementHandle[]
      | { value?: string; label?: string; index?: number }
      | { value?: string; label?: string; index?: number }[],
    options?: LocatorOptions
  ): Promise<string[]> => this.element.selectOption(values, options);
  /* This method waits for [actionability](https://playwright.dev/docs/actionability) checks, then focuses the element and selects all its
   * text content.
   *
   * If the element is inside the `<label>` element that has an associated
   * [control](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/control), focuses and selects text in
   * the control instead.
   * @param options
   */
  protected selectText = (options?: {
    force?: boolean;
    timeout?: number;
  }): Promise<void> => this.element.selectText(options);
  /**
   * Set the state of a checkbox or a radio element.
   *
   * **Usage**
   *
   * ```js
   * await page.getByRole('checkbox').setChecked(true);
   * ```
   *
   * **Details**
   *
   * This method checks or unchecks an element by performing the following steps:
   * 1. Ensure that matched element is a checkbox or a radio input. If not, this method throws.
   * 1. If the element already has the right checked state, this method returns immediately.
   * 1. Wait for [actionability](https://playwright.dev/docs/actionability) checks on the matched element, unless `force` option is set. If
   *    the element is detached during the checks, the whole action is retried.
   * 1. Scroll the element into view if needed.
   * 1. Use [page.mouse](https://playwright.dev/docs/api/class-page#page-mouse) to click in the center of the
   *    element.
   * 1. Wait for initiated navigations to either succeed or fail, unless `noWaitAfter` option is set.
   * 1. Ensure that the element is now checked or unchecked. If not, this method throws.
   *
   * When all steps combined have not finished during the specified `timeout`, this method throws a [TimeoutError].
   * Passing zero timeout disables this.
   * @param checked Whether to check or uncheck the checkbox.
   * @param options
   */
  protected setChecked = (
    checked: boolean,
    options?: SetCheckedOptions
  ): Promise<void> => this.element.setChecked(checked, options);

  /**
   * Upload file or multiple files into `<input type=file>`.
   *
   * **Usage**
   *
   * ```js
   * // Select one file
   * await page.getByLabel('Upload file').setInputFiles('myfile.pdf');
   *
   * // Select multiple files
   * await page.getByLabel('Upload files').setInputFiles(['file1.txt', 'file2.txt']);
   *
   * // Remove all the selected files
   * await page.getByLabel('Upload file').setInputFiles([]);
   *
   * // Upload buffer from memory
   * await page.getByLabel('Upload file').setInputFiles({
   *   name: 'file.txt',
   *   mimeType: 'text/plain',
   *   buffer: Buffer.from('this is test')
   * });
   * ```
   *
   * **Details**
   *
   * Sets the value of the file input to these file paths or files. If some of the `filePaths` are relative paths, then
   * they are resolved relative to the current working directory. For empty array, clears the selected files.
   *
   * This method expects [Locator] to point to an
   * [input element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input). However, if the element is inside
   * the `<label>` element that has an associated
   * [control](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/control), targets the control instead.
   * @param files
   * @param options
   */
  protected setInputFiles = (
    files: SetFileArgs,
    options?: { noWaitAfter?: boolean; timeout?: number }
  ): Promise<void> => this.element.setInputFiles(files, options);
  /**
   * Focuses the element, and then sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the
   * text.
   *
   * To press a special key, like `Control` or `ArrowDown`, use
   * [locator.press(key[, options])](https://playwright.dev/docs/api/class-locator#locator-press).
   *
   * **Usage**
   *
   * ```js
   * await element.type('Hello'); // Types instantly
   * await element.type('World', {delay: 100}); // Types slower, like a user
   * ```
   *
   * An example of typing into a text field and then submitting the form:
   *
   * ```js
   * const element = page.getByLabel('Password');
   * await element.type('my password');
   * await element.press('Enter');
   * ```
   *
   * @param text A text to type into a focused element.
   * @param options
   */
  protected type = (text: string, options?: TypeOptions): Promise<void> =>
    this.element.type(text, options);
  /**
   * Returns when element specified by locator satisfies the `state` option.
   *
   * If target element already satisfies the condition, the method returns immediately. Otherwise, waits for up to
   * `timeout` milliseconds until the condition is met.
   *
   * **Usage**
   *
   * ```js
   * const orderSent = page.locator('#order-sent');
   * await orderSent.waitFor();
   * ```
   *
   * @param options
   */
  waitFor = (options?: WaitForOptions): Promise<void> =>
    this.element.waitFor(options);

  /**
   * Set a value to the input field.
   *
   * **Usage**
   *
   * ```js
   * await page.getByRole('textbox').fill('example value');
   * ```
   *
   * **Details**
   *
   * This method waits for [actionability](https://playwright.dev/docs/actionability) checks, focuses the element, fills it and triggers an
   * `input` event after filling. Note that you can pass an empty string to clear the input field.
   *
   * If the target element is not an `<input>`, `<textarea>` or `[contenteditable]` element, this method throws an
   * error. However, if the element is inside the `<label>` element that has an associated
   * [control](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/control), the control will be filled
   * instead.
   *
   * To send fine-grained keyboard events, use
   * [locator.type(text[, options])](https://playwright.dev/docs/api/class-locator#locator-type).
   * @param value Value to set for the `<input>`, `<textarea>` or `[contenteditable]` element.
   * @param options
   */
  protected fill = (text: string, options?: FillOptions) =>
    this.element.fill(text, options);

  /**
   * Click an element.
   *
   * **Details**
   *
   * This method clicks the element by performing the following steps:
   * 1. Wait for [actionability](https://playwright.dev/docs/actionability) checks on the element, unless `force` option is set.
   * 1. Scroll the element into view if needed.
   * 1. Use [page.mouse](https://playwright.dev/docs/api/class-page#page-mouse) to click in the center of the
   *    element, or the specified `position`.
   * 1. Wait for initiated navigations to either succeed or fail, unless `noWaitAfter` option is set.
   *
   * If the element is detached from the DOM at any moment during the action, this method throws.
   *
   * When all steps combined have not finished during the specified `timeout`, this method throws a [TimeoutError].
   * Passing zero timeout disables this.
   *
   * **Usage**
   *
   * Click a button:
   *
   * ```js
   * await page.getByRole('button').click();
   * ```
   *
   * Shift-right-click at a specific position on a canvas:
   *
   * ```js
   * await page.locator('canvas').click({
   *   button: 'right',
   *   modifiers: ['Shift'],
   *   position: { x: 23, y: 32 },
   * });
   * ```
   *
   * @param options
   */
  protected click = (options?: ClickOptions) => this.element.click(options);
  /**
   * Perform a tap gesture on the element matching the locator.
   *
   * **Details**
   *
   * This method taps the element by performing the following steps:
   * 1. Wait for [actionability](https://playwright.dev/docs/actionability) checks on the element, unless `force` option is set.
   * 1. Scroll the element into view if needed.
   * 1. Use [page.touchscreen](https://playwright.dev/docs/api/class-page#page-touchscreen) to tap the center of the
   *    element, or the specified `position`.
   * 1. Wait for initiated navigations to either succeed or fail, unless `noWaitAfter` option is set.
   *
   * If the element is detached from the DOM at any moment during the action, this method throws.
   *
   * When all steps combined have not finished during the specified `timeout`, this method throws a [TimeoutError].
   * Passing zero timeout disables this.
   *
   * **NOTE** `element.tap()` requires that the `hasTouch` option of the browser context be set to true.
   * @param options
   */
  protected tap = (options?: TapOptions) => this.element.tap(options);
  /**
   * Focuses the mathing element and presses a combintation of the keys.
   *
   * **Usage**
   *
   * ```js
   * await page.getByRole('textbox').press('Backspace');
   * ```
   *
   * **Details**
   *
   * Focuses the element, and then uses
   * [keyboard.down(key)](https://playwright.dev/docs/api/class-keyboard#keyboard-down) and
   * [keyboard.up(key)](https://playwright.dev/docs/api/class-keyboard#keyboard-up).
   *
   * `key` can specify the intended
   * [keyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) value or a single character
   * to generate the text for. A superset of the `key` values can be found
   * [here](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values). Examples of the keys are:
   *
   * `F1` - `F12`, `Digit0`- `Digit9`, `KeyA`- `KeyZ`, `Backquote`, `Minus`, `Equal`, `Backslash`, `Backspace`, `Tab`,
   * `Delete`, `Escape`, `ArrowDown`, `End`, `Enter`, `Home`, `Insert`, `PageDown`, `PageUp`, `ArrowRight`, `ArrowUp`,
   * etc.
   *
   * Following modification shortcuts are also supported: `Shift`, `Control`, `Alt`, `Meta`, `ShiftLeft`.
   *
   * Holding down `Shift` will type the text that corresponds to the `key` in the upper case.
   *
   * If `key` is a single character, it is case-sensitive, so the values `a` and `A` will generate different respective
   * texts.
   *
   * Shortcuts such as `key: "Control+o"` or `key: "Control+Shift+T"` are supported as well. When specified with the
   * modifier, modifier is pressed and being held while the subsequent key is being pressed.
   * @param key Name of the key to press or a character to generate, such as `ArrowLeft` or `a`.
   * @param options
   */
  protected press = (key: string, options?: PressOptions) =>
    this.element.press(key, options);

  protected allInnerTexts = () => this.element.allInnerTexts();

  protected allTextContents = () => this.element.allTextContents();

  /**
   * Ensure that checkbox or radio element is checked.
   *
   * **Details**
   *
   * Performs the following steps:
   * 1. Ensure that element is a checkbox or a radio input. If not, this method throws. If the element is already
   *    checked, this method returns immediately.
   * 1. Wait for [actionability](https://playwright.dev/docs/actionability) checks on the element, unless `force` option is set.
   * 1. Scroll the element into view if needed.
   * 1. Use [page.mouse](https://playwright.dev/docs/api/class-page#page-mouse) to click in the center of the
   *    element.
   * 1. Wait for initiated navigations to either succeed or fail, unless `noWaitAfter` option is set.
   * 1. Ensure that the element is now checked. If not, this method throws.
   *
   * If the element is detached from the DOM at any moment during the action, this method throws.
   *
   * When all steps combined have not finished during the specified `timeout`, this method throws a [TimeoutError].
   * Passing zero timeout disables this.
   *
   * **Usage**
   *
   * ```js
   * await page.getByRole('checkbox').check();
   * ```
   *
   * @param options
   */
  protected check = (options?: CheckOptions) => this.element.check(options);

  /**
   * Ensure that checkbox or radio element is unchecked.
   *
   * **Usage**
   *
   * ```js
   * await page.getByRole('checkbox').uncheck();
   * ```
   *
   * **Details**
   *
   * This method unchecks the element by performing the following steps:
   * 1. Ensure that element is a checkbox or a radio input. If not, this method throws. If the element is already
   *    unchecked, this method returns immediately.
   * 1. Wait for [actionability](https://playwright.dev/docs/actionability) checks on the element, unless `force` option is set.
   * 1. Scroll the element into view if needed.
   * 1. Use [page.mouse](https://playwright.dev/docs/api/class-page#page-mouse) to click in the center of the
   *    element.
   * 1. Wait for initiated navigations to either succeed or fail, unless `noWaitAfter` option is set.
   * 1. Ensure that the element is now unchecked. If not, this method throws.
   *
   * If the element is detached from the DOM at any moment during the action, this method throws.
   *
   * When all steps combined have not finished during the specified `timeout`, this method throws a [TimeoutError].
   * Passing zero timeout disables this.
   * @param options
   */
  protected uncheck = (options?: CheckOptions) => this.element.uncheck(options);

  /**
   * Clear the input field.
   *
   * **Details**
   *
   * This method waits for [actionability](https://playwright.dev/docs/actionability) checks, focuses the element, clears it and triggers an
   * `input` event after clearing.
   *
   * If the target element is not an `<input>`, `<textarea>` or `[contenteditable]` element, this method throws an
   * error. However, if the element is inside the `<label>` element that has an associated
   * [control](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/control), the control will be cleared
   * instead.
   *
   * **Usage**
   *
   * ```js
   * await page.getByRole('textbox').clear();
   * ```
   *
   * @param options
   */
  protected clear = (options?: LocatorOptions) => this.element.clear(options);
}

function createChildComponents<T extends Component>(
  cls: Class<T>,
  locator: Locator,
  children: DecoratedProperty<Component>[]
) {
  const accumulator: [string, Component][] = [];
  for (const { property, type } of children) {
    const childLocatorFactory: LocatorFactory = Reflect.getMetadata(
      locatorMetakey,
      cls.prototype,
      property
    );
    throwIfNoChildLocatorFound(childLocatorFactory, property, type);
    accumulator.push(
      createAndAssignChildComponent(
        property,
        type,
        childLocatorFactory(locator)
      )
    );
  }
  return accumulator;
}

function createAndAssignChildComponent(
  property: string,
  type: Class<Component>,
  childLocator: Locator
): [string, Component] {
  const pc = SemanticComponent.browse(type, childLocator);
  return [property, pc];
}

function throwIfNoChildLocatorFound(
  childLocatorFactory: LocatorFactory,
  property: string,
  type: Class<Component>
) {
  if (!childLocatorFactory) {
    throw new Error(
      `Cannot construct Component property ${property} of type ${type.name} without a Locator. Try adding a locator decorator like @Locate or @AltText`
    );
  }
}
