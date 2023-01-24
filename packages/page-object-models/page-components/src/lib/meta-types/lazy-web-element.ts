import {
  WebElement,
  WebDriver,
  Locator,
  WebElementPromise,
  ISize,
  IRectangle,
  ILocation,
  IWebElementId,
  WebElementCondition,
} from 'selenium-webdriver';
import { ShadowRootPromise } from 'selenium-webdriver/lib/webdriver';
import { WaitOptions } from '../types';
import { PageObject } from './page-object';

export class ComponentProxyWebElement implements WebElement {
  #innerElementUnsafe?: WebElement;
  #loader?: () => Promise<WebElement>;
  #driver?: WebDriver;
  #component?: PageObject;
  #options: () => WaitOptions;
  constructor(component: PageObject, options: () => WaitOptions) {
    this.#component = component;
    this.#options = options;
  }

  get configured() {
    return this.#loader && this.#driver;
  }
  get element(): Promise<WebElement> {
    return this.elementGetter();
  }
  set elementLoaded(value: WebElement) {
    this.#innerElementUnsafe = value;
  }

  private async elementGetter(): Promise<WebElement> {
    if (this.#innerElementUnsafe) {
      return this.#innerElementUnsafe;
    }
    const { until, by, timeout } = this.#options();
    try {
      this.#innerElementUnsafe = await this.#component?.searcher?.findElement(
        by
      );
    } catch (err) {
      const error = err as Error;
      if (
        error
          .toString()
          .includes('TypeError: Cannot read properties of undefined')
      ) {
        error.message = `Component searcher for '${
          this.#component?.pomName
        }' was undefined. Searcher is automatically injected by Autometa after instantiation. Did you accidentally call a method while exposing it? For example 'click = this.click()' instead of 'click = this.click'? \n\t${
          error.message
        }`;
      }
      throw err;
    }
    if (!this.#innerElementUnsafe) {
      throw new Error(
        "Lazy Element attempted to access it's inner WebElement without assigning it"
      );
    }
    const condition = until.extract(this.#innerElementUnsafe, by);
    try {
      if (condition instanceof WebElementCondition) {
        await this.#component?.wait(condition, timeout);
      }
    } catch (err) {
      const clsName = this.constructor.name;
      throw new Error(`Attempt to wait for ${clsName}[${
        this.#component?.pomName
      }][${by}, ${until}] failed with error:
    ${err}`);
    }
    return this.#innerElementUnsafe;
  }

  markStale = () => {
    this.#innerElementUnsafe = undefined;
  };

  getDriver = (): WebDriver => {
    if (!this.#driver) {
      throw new Error('Tried to use an unassigned driver');
    }
    return this.#driver;
  };

  getId = async (): Promise<string> => {
    return (await this.element).getId();
  };

  #tryUseElement = async <T>(
    prefix: string,
    fn: (element: WebElement) => Promise<T>
  ) => {
    try {
      const element = await this.element;
      return fn(element);
    } catch (err) {
      if (!this.#component) {
        throw new Error(
          'ComponentProxyWebElement does not have a reference to its parent component.'
        );
      }
      if (`${err}`.startsWith('StaleElementReferenceError')) {
        console.warn(
          `Element was found to be stale. Refreshing POM and attempting one more time to communicate with the webdriver. \n${this.#component.breadcrumbs()}`
        );
        this.#component.refresh(true);
        const element = await this.element;
        return fn(element);
      }
      const error = err as Error;
      error.message = `Failed to perform action on ${this.#component.breadcrumbs()}.${prefix} \n ${err}`;
      throw error;
    }
  };
  #use = <T>(prefix: string, fn: (element: WebElement) => Promise<T>) => {
    return async () => {
      return this.#tryUseElement(prefix, fn);
    };
  };

  findElement = (locator: Locator): WebElementPromise => {
    return this.#tryUseElement('find::findElements()', (element) =>
      element.findElement(locator)
    ) as unknown as WebElementPromise;
  };

  findElements = (locator: Locator) =>
    this.#tryUseElement('findAll::findElements()', (element) =>
      element.findElements(locator)
    );

  click = this.#use('click', (element) => element.click());

  sendKeys = (...var_args: (string | number | Promise<string | number>)[]) =>
    this.#tryUseElement('write::sendKeys()', (element) =>
      element.sendKeys(...var_args)
    );

  getTagName = this.#use('tag::getTagName()', (element) =>
    element.getTagName()
  );

  getCssValue = async (cssStyleProperty: string): Promise<string> => {
    return this.#tryUseElement('getCss::getCssValue()', (element) =>
      element.getCssValue(cssStyleProperty)
    );
  };

  getAttribute = async (attributeName: string): Promise<string> => {
    return this.#tryUseElement('getAttribute()', (element) =>
      element.getAttribute(attributeName)
    );
  };

  getText = async (): Promise<string> => {
    return this.#tryUseElement('text::getText()', (element) =>
      element.getText()
    );
  };

  getSize = async (): Promise<ISize> => {
    return this.#tryUseElement('structure.size::getSize()', (element) =>
      element.getSize()
    );
  };

  getRect = async (): Promise<IRectangle> => {
    return this.#tryUseElement('structure.rect::getRect()', (element) =>
      element.getRect()
    );
  };

  getLocation = async (): Promise<ILocation> => {
    return this.#tryUseElement('structure.location::getLocation()', (element) =>
      element.getLocation()
    );
  };

  isEnabled = async (): Promise<boolean> => {
    return this.#tryUseElement('isEnabled', (element) => element.isEnabled());
  };

  isSelected = async (): Promise<boolean> => {
    return this.#tryUseElement('isSelected', (element) => element.isSelected());
  };

  submit = async (): Promise<void> => {
    return this.#tryUseElement('submit', (element) => element.submit());
  };

  clear = async (): Promise<void> => {
    return this.#tryUseElement('clear', (element) => element.clear());
  };

  isDisplayed = async (): Promise<boolean> => {
    return this.#tryUseElement('isDisplayed', (element) =>
      element.isDisplayed()
    );
  };

  takeScreenshot = async (opt_scroll?: boolean): Promise<string> => {
    return this.#tryUseElement('screenshot::takeScreenshot', (element) =>
      element.takeScreenshot(opt_scroll)
    );
  };

  getShadowRoot = (): ShadowRootPromise => {
    return this.#tryUseElement('getShadowRoot()', (element) =>
      element.getShadowRoot()
    ) as unknown as ShadowRootPromise;
  };

  serialize = async (): Promise<IWebElementId> => {
    return this.#tryUseElement('serialize()', (element) => element.serialize());
  };
}
