import { EventEmitter } from 'events';
import {
  Locator,
  WebDriver,
  WebElement,
  WebElementCondition,
} from 'selenium-webdriver';

interface Searcher {
  findElement(by: Locator): Promise<WebElement>;
  findElements(by: Locator): Promise<WebElement>;
}

/**
 * Base type for all Page Objects, including Pages
 * and Components
 *
 * Should not be constructed manually. The property
 * values of PageObject are injected by this library
 * at run time.
 */
export abstract class PageObject {
  protected _eventEmitter!: EventEmitter;
  protected get events() {
    return this._eventEmitter;
  }
  protected _pomName!: string;
  protected _driver!: WebDriver;
  protected _searcher!: Searcher;
  /**
   * Reference to the WebDriver powering this PageObject
   */
  protected get driver() {
    return this._driver;
  }
  /**
   * Returns the name of this Component in the Page Object Model.
   * This will be the name of the property associated with this
   * Component. E.g. for the following pom
   *
   * ```
   * @component(Button, By.id('my-id'))
   * myButton: Button
   * ```
   *
   * The pomName of that Button will be "myButton".
   */
  get pomName(): string {
    return this._pomName;
  }
  /**
   * Get's the search driver for this Page Object that is used to find elements on screen. Injected automatically.
   * For a Page, the search driver will be the WebDriver. For Components, the search driver
   * will be their own WebElement. This way, all components are scoped to their parent,
   * and will only be searched for under their parent, simplifying locators and
   * improving performance.
   */
  get searcher() {
    const searc = this._searcher;
    return searc;
  }

  /**
   * Pause execution for a given timeout.
   * @param timeout The time in milliseconds to pause
   * @returns a promise which stalls execution for the specified time when awaited
   */
  pause = async (timeout: number) => {
    return new Promise((resolve) => setTimeout(resolve, timeout));
  };

  /**
   * Creates a string of the component hierarchy of this component, listing
   * the ancestor components of this one.
   *
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  breadcrumbs = (_?: string, __ = true) => {
    return `${this.constructor.name}[${this.pomName ?? '$root'}]`;
  };

  abstract refresh(propagate: boolean, pomName?: string): void;
  abstract get depth(): number;
  async wait(condition: WebElementCondition, timeout: number) {
    await this._driver.wait(condition, timeout);
  }
}
