import { WebElement, By } from 'selenium-webdriver';
import { PageObject } from './page-object';
import { ConstructionOptions, WaitOptions } from '../types';
import { Until } from '../until/until';
import { UntilCondition } from '../until/until-condition';
import { constructDynamicComponentFromFind } from './util';
import { ComponentProxyWebElement } from './lazy-web-element';
import { ComponentSettings } from '../components/component-settings';
import { POM } from '../settings';
import { ElementArray } from '../components/lazy-element-array';
import { green } from 'colors-cli';
import { FindElement, SendKeys } from './actions';

/**
 * Base class for Web Components. Web Components are
 * this libraries wrapper around @see WebElement
 *
 * Does not expose element actions by default - such as
 * clicking or typing. They exist as protected methods here
 * with `_underScoredNames`. It's up to Component implementations
 * to expose the appropriate actions. To implement a component,
 * simply inherit from this class and define the subcomponents
 * on that type.
 *
 * Component respects the following settings/options:
 *
 * * Component Logs - If true, components will log messages to console.info when they
 *                    take an action like clicking or typing.
 * * Component Log Details - If true, components will attempt to log details
 *                           about the element that help identify it on screen from logs.
 *                           In most cases this will be the element text. A button might be logged as:
 *                           `Clicking on Button['Click Here!'] By('css', 'div>button')`. This may
 *                            affect performance and test stability.
 * Component Auto Wait - If enabled, components attempt to wait for a condition before
 *                       moving on from creating the the underlying webElement. The wait
 *                       will use the `Until` condition which has been defined in either the
 *                       `@component` tag or by overriding the `_defaultUntil` property in component
 *                       subclasses.
 *
 * Slow Down/Human Mode - If enabled, all actions will be delayed by a specified timeout. Useful
 *                        for when you want to view the full execution of a test in real time. 500ms
 *                        is usually sufficient.
 *
 */
export abstract class Component extends PageObject {
  [key: string]: unknown;
  protected self = this;
  get depth(): number {
    return this._parent.depth + 1;
  }
  /**
   * Underlying WebElement this Component wraps.
   *
   * *Warning* this property is not considered safe due
   * to lazy initialization. Either ensure the element
   * has been loaded first, or preferably interact with the
   * element through {@see Component._action}.
   */
  protected _element: ComponentProxyWebElement = new ComponentProxyWebElement(
    this,
    () => this._waitOptions
  );
  /**
   * Reference to the parent Page or Component
   * of this Component. Injected during object creation.
   */
  protected _parent!: PageObject;
  /**
   * If no `Until` condition is specified in
   * `@component()`, this default value will be used.
   * Can be overridden as appropriate by child components
   * and the override will be used instead.
   */
  protected _defaultUntil: UntilCondition = Until.isLocated;
  /**
   * The logger used by this Component. Currently
   * only the default console and a null (prints nothing) console
   * are supported.
   */
  protected _logger = console;
  /**
   * Determines how this component will be `wait`ed.
   * These values are updated during object initialization
   * based on values provided by `@component`.
   */
  protected _waitOptions: WaitOptions = {
    until: this._defaultUntil,
    by: undefined as unknown as By,
    timeout: 1500,
  };

  constructor() {
    super();
  }

  /**
   * Returns a promise of the underlying web element. Loaded lazily
   * and cached.
   */
  get element(): ComponentProxyWebElement {
    return this._element;
  }

  /**
   * Retrieves the HTML tag of this Component.
   */
  get tag(): Promise<string> {
    return this._action(
      (element) => element.getTagName(),
      'Getting Tag Name Of'
    );
  }

  getCss = (propertyName: string): Promise<string> => {
    return this._action(
      (element) => element.getCssValue(propertyName),
      'Getting Css Value of'
    );
  };

  /**
   * Indicates if the underlying web element is considered enabled by selenium.
   *
   * Example:
   * ```
   * expect(await button.isEnabled).toBe(true)
   * // or
   * expect(button.isEnabled).resolves.toBe(true)
   * ```
   */
  get isEnabled() {
    return this._action(
      (element) => element.isEnabled(),
      'Checking if Enabled for'
    );
  }

  /**
   * Indicates if the underlying web element is considered displayed by Selenium
   *
   * Example:
   * ```
   * expect(await button.isDisplayed).toBe(true)
   * // or
   * expect(button.isDisplayed).resolves.toBe(true)
   * ```
   */
  get isDisplayed() {
    return this._action(
      (element) => element.isDisplayed(),
      'Checking if Displayed for'
    );
  }

  /**
   * Alias for `isDisplayed`
   *
   * Example:
   * ```
   * expect(await button.isVisible).toBe(true)
   * // or
   * expect(button.isVisible).resolves.toBe(true)
   * ```
   */
  get isVisible() {
    return this.isDisplayed;
  }

  /**
   * Provides an object of functions which contain the structural
   * details of the underlying web element, such as it's rect and
   * location coordinates.
   */
  get structure() {
    return {
      size: this._actionFactory(
        (element) => element.getSize(),
        'Getting Element Size'
      ),
      rect: this._actionFactory(
        (element) => element.getRect(),
        'Getting Element Rect'
      ),
      location: this._actionFactory(
        (element) => element.getLocation(),
        'Getting Element Rect'
      ),
    };
  }
  /**
   * Inheritable getter to replace the console with a null console
   * when logging is disabled. Currently only the node console
   * is available for logging.
   */
  protected get logger() {
    if (POM.settings.shouldComponentsLog()) {
      return this._logger;
    }
    return {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      info: (..._: unknown[]) => undefined,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      log: (..._: unknown[]) => undefined,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      debug: (..._: unknown[]) => undefined,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      error: (..._: unknown[]) => undefined,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      warn: (..._: unknown[]) => undefined,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      trace: (..._: unknown[]) => undefined,
    };
  }

  /**
   * When awaited, it will pause execution for the amount
   * of time configured in @see ComponentSettings
   *
   * All action types (methods here which call to _action())
   * are affected by this by default if the timeout is greater
   * than 0. Only call this if you're bypassing the default actions.
   */
  protected get slowMode() {
    return new Promise((resolve) =>
      setTimeout(resolve, ComponentSettings.getSlowMode())
    );
  }

  /**
   * Factory method for interacting directly with the
   * underlying WebElement. Accepts a function and
   * accesses the WebElement - if successful, the WebElement
   * will be passed as the argument.
   *
   * Also accepts a string describing what action is about to be
   * taken, which will be logged in the (example) format `Clicking On Button By(css, 'button')`
   * where 'Clicking On' is the provided prefix.
   *
   * Used by the WebElement action methods like `_click` and `_text`.
   *
   * Example:
   * ```
   *
   * export class MyComponent extends Component {
   *  myAction = this._action((element: WebElement)=>{
   *      return element.doSomeAction();
   *  })
   *  // or
   *  myAction = this._action(async (element: WebElement)=>{
   *      await element.doSomeAction();
   *  })
   * }
   * ```
   * @param fn A function to execute which accepts a WebElement to act on
   * @param logPrefix A prefix string to identify this action by
   * @returns The return value of {@see fn}
   */
  protected _actionFactory = <T>(
    fn: (element: WebElement) => Promise<T>,
    logPrefix: string
  ): (() => Promise<T>) => {
    return async () => this._action(fn, logPrefix);
  };

  protected _action = async <T>(
    fn: (element: WebElement) => Promise<T>,
    logPrefix: string
  ): Promise<T> => {
    // const details = await this.#loggableDetails(this.element);
    // this.#logActionOccurring(logPrefix, details);
    // await this.slowMode;
    return this.#tryPerformAction(fn, this.element, logPrefix);
  };

  /**
   * Takes a screenshot of the area on screen which
   * exists inside the bounding box of this Component.
   */
  screenshot = this._actionFactory(
    (element) => element.takeScreenshot(),
    'Taking a Screenshot of'
  );

  toStringAsync = async () => {
    return `${this.constructor.name}[${await this.read()}]`;
  };

  refresh = (propagate = false, pomName?: string) => {
    console.log(`Marking Component chain as stale: ${this.breadcrumbs()}`);
    this._element.markStale();
    if (propagate) {
      this._parent.refresh(propagate, pomName);
    }
  };

  /**
   * Retrieves the tag ID of this Component.
   * This represents the _attribute_ 'id' as it appears
   * on a HTML tag, e.g.
   * ```
   * <p id='foo'>Hello World</p>
   * ```
   *
   * Which is not the same as the server assigned id
   * from `WebElement.getId()`
   */
  get id() {
    return this.getAttribute('id');
  }

  /**
   * Retrieves the server assigned ID for this Component.
   * Equivalent to `WebElement.getId()`
   */
  get serverSideId() {
    return this._action((element) => element.getId(), '');
  }

  /**
   * Retrieves the class attribute of this
   * Component, e.g.
   * ```
   * <p class='first-paragraph'></p>
   * ```
   *
   * returns 'first-paragraph'
   */
  get class() {
    return this.getAttribute('class');
  }

  protected get isSelected() {
    return this._action(
      (element) => element.isSelected(),
      'Checking Is Selected'
    );
  }
  /**
   * Retrieves an attribute on this Components
   * HTML tag by its name.
   * @param name The name of the attribute to retrieve
   * @returns the string value of the attribute
   */
  getAttribute = async (name: string) => {
    const value = await this._action(
      (element) => element.getAttribute(name),
      `Getting Attribute '${name}' from`
    );
    // if (POM.settings.shouldComponentsLog()) {
    //   this.#logActionOccurring(`Found {${name}: '${value}'} for`, '');
    // }
    return value;
  };
  /**
   * Attempts to scroll to this Component if
   * it is not on screen.
   */
  scrollTo = this._actionFactory(async (element) => {
    await this.driver.executeScript(
      'arguments[0].scrollIntoView(true);',
      element
    );
  }, 'Scrolling to');

  override breadcrumbs = (details?: string, isBottom = true) => {
    const depth = this.depth;
    const detailString = details ? `( ${details} )` : '';
    const tag = `${'  '.repeat(depth)}${this.constructor.name}[${
      this._pomName
    }, ${this._waitOptions.by}]${detailString}`;
    const colored = isBottom ? green(tag) : tag;
    return `${this._parent.breadcrumbs(undefined, false)} > \n${colored}`;
  };
  /**
   * When exposed, allows a component to be clicked.
   *
   * Example:
   * ```
   * export class MyComponent extends Component {
   *   click = this._click;
   *
   *   // or
   *   click = ()=>{
   *    if(myCustomCheck){
   *      return this._click()
   *    }
   *   }
   * }
   * ...
   * await page.myComponent.click()
   * ```
   */
  protected click = this._actionFactory(
    (element) => element.click(),
    'Clicking On'
  );

  /**
   * When exposed, allows a component to clear it's text or value.
   *
   * Example:
   * ```
   * export class MyComponent extends Component {
   *   clear = this._clear;
   *
   *   // or
   *   clear = ()=>{
   *    if(myCustomCheck){
   *      return this._clear()
   *    }
   *   }
   * }
   * ...
   * await page.myComponent.clear()
   * ```
   */
  protected clear = this._actionFactory(
    (element) => element.clear(),
    'Clearing'
  );

  /**
   * @aliasOf WebElement.sendKeys
   *
   * When exposed, allows a component to have text typed into it.
   * Example:
   * ```
   * export class MyComponent extends Component {
   *   type = this._type;
   *
   *   // or
   *   type = ()=>{
   *    if(myCustomCheck){
   *      return this._type()
   *    }
   *   }
   * }
   *
   * ...
   *
   * await page.myComponent.type('hello world')
   * ```
   *
   * @param text The text to type into this component on the browser.
   * @param others Any other text or keys to enter.
   * @returns an asynchronous action which will call `sendKeys`
   */
  protected write: SendKeys = (text: string | number, ...others: unknown[]) =>
    this._action(
      (element) => element.sendKeys(text, ...(others as string[])),
      `Typing '${text}' into`
    );

  /**
   * @aliasOf WebELement.getText
   *
   * When exposed, allows a Component to be read from.
   * Can be exposed as a getter.
   *
   * Example:
   * ```
   * export class MyComponent extends Component {
   *   get text(){
   *    return this._text;
   *  }
   *
   * ...
   *
   * const text: string = await page.myComponent.text
   * ```
   */
  // protected get text() {
  //   return this._action((element) => element.getText(), 'Reading Text From');
  // }
  protected read() {
    return this._action((element) => element.getText(), 'Reading Text From');
  }
  /**
   * When exposed, marks this Component as an element of
   * a form that can be submitted for processing.
   *
   * Example:
   * ```
   * export class MyComponent extends Component {
   *   type = this._type;
   *
   *   // or
   *   type = ()=>{
   *    if(myCustomCheck){
   *      return this._type()
   *    }
   *   }
   * }
   *
   * ...
   *
   * await page.myComponent.submit()
   * ```
   */
  protected submit = this._actionFactory(
    (element) => element.submit(),
    'Submitting Value For'
  );

  /**
   * @aliasOf WebElement.findElement
   *
   * Attempts to find a Component which exists
   * as a descendant of this one. If found, it
   * will be constructed automatically into the
   * component type defined in {@see options}
   *
   * @param options Type and Locator information to find and construct the expected Component
   * @returns a new Component which matches the provided options.
   */
  protected find: FindElement = async <T extends Component>(
    options: ConstructionOptions<T>,
    name: string
  ): Promise<T> => {
    return this._actionFactory<T>(async (element) => {
      const childElement = await element.findElement(
        options.by ??
          By.js(() => {
            throw new Error('Provided an undefined locator');
          })
      );
      return constructDynamicComponentFromFind(
        options,
        this,
        childElement,
        name
      );
    }, 'Finding Element')();
  };

  /**
   * @aliasOf WebElement.findElements()
   *
   * Attempts to find all matching Components which are descended from this one.
   * If found, they will be constructed automatically into the
   * component type defined in {@see options}
   *
   * @param options Type and Locator information to find and construct the expected Components
   * @returns a new Component which matches the provided options.
   */
  protected findAll = <T extends Component>(
    options: ConstructionOptions<T>
  ): ElementArray<T> => {
    return new ElementArray<T>(
      () => options.type,
      async () => {
        console.info(
          `Searching for [${options.type.name}, ${options.by}]
  in ${this.breadcrumbs()}`
        );
        const elements = await this.element.findElements(
          options.by ??
            By.js(() => {
              throw new Error('Provided an undefined locator');
            })
        );
        console.log(
          `Found ${elements.length} elements in [${options.type.name}, ${
            options.by
          }]
  in ${this.breadcrumbs()}`
        );
        return elements;
      },
      (loadedElement: WebElement, index: number) => {
        return constructDynamicComponentFromFind<T>(
          options,
          this,
          loadedElement,
          index.toString()
        );
      },
      () => this.events
    );
  };

  #logActionOccurring(logPrefix: string, value: string) {
    this.logger.info(`${logPrefix} ${this.breadcrumbs(value)}`);
  }

  #tryPerformAction = <T>(
    action: (element: WebElement) => Promise<T>,
    element: WebElement,
    prefix: string
  ) => {
    try {
      return action(element);
    } catch (err) {
      if (err)
        (
          err as { message: string }
        ).message = `Failed to perform action '${prefix}' on ${this.constructor.name} ${this._waitOptions.by} ${this._waitOptions.until.name} \n ${err}`;
      throw err;
    }
  };

  #loggableDetails = async (element: WebElement) => {
    if (POM.settings.shouldComponentsLogDetails()) {
      return `{ text: "${await element.getText()}" }`;
    }
    return '';
  };
}
