import 'reflect-metadata';
import { Condition, WebDriver } from 'selenium-webdriver';
import {
  titleContains,
  titleIs,
  titleMatches,
} from 'selenium-webdriver/lib/until';
import { EventEmitter } from 'stream';
import { constructor } from 'tsyringe/dist/typings/types';
import { PageObject } from './page-object';
import { applyComponentDecorators, applyPageDecorators } from './util';

/**
 * Base type for Page Objects which are Web Pages. Web Pages
 * are root containers for components.
 */
export abstract class WebPage extends PageObject {
  readonly route: string | undefined = undefined;
  protected _parent!: WebPage;
  wait = (until: Condition<unknown>, timeout: number) =>
    this.driver.wait(until, timeout);
  waitForTitleIs = (title: string, timeout = 1500) => {
    return this.driver.wait(titleIs(title), timeout);
  };
  waitForTitleContains = (title: string, timeout = 1500) => {
    return this.driver.wait(titleContains(title), timeout);
  };
  waitForTitleMatches = (title: RegExp, timeout = 1500) => {
    return this.driver.wait(titleMatches(title), timeout);
  };

  /**
   * Constructs the Page Object objects described by {@see type}
   * and all of it's dependencies recursively. Once resolved,
   * WebElements will be created and accessed lazily as used.
   *
   * @param type The class (not class _instance_) of the Web Page to use as root
   * @param driver The configured WebDriver to use
   * @returns The constructed Web Page and it's components.
   */
  static Render<T extends WebPage>(type: constructor<T>, driver: WebDriver) {
    const page = new type();
    page._eventEmitter = new EventEmitter();
    page._eventEmitter.setMaxListeners(500);
    page._driver = driver;
    applyPageDecorators(page);
    applyComponentDecorators(page);
    return page;
  }

  /**
   * Starts up the webpage, loading it in the browser.
   * @param url The url to visit
   * @returns this Web Page instance
   */
  visit = async (url: string) => {
    await this.driver.get(url);
    return this;
  };

  /**
   * marks all Components as stale and forces
   * them to be lazily reinitialized on next access
   */
  refresh = (propagate = true, name?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (name) (this as any)[name].refresh();
    if (propagate) this.events.emit('ForceRefreshAll');
  };

  get depth(): number {
    if (!this._parent) {
      return 0;
    }
    return this._parent.depth;
  }

  get title(){
    return this._driver.getTitle()
  }
}
