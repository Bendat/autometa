import { Builder, WebDriver } from 'selenium-webdriver';
import { constructor } from 'tsyringe/dist/typings/types';
import { URL } from 'url';
import { WebPage } from './meta-types/web-page';

export class DriverProxy {
  #started = false;
  #driver: WebDriver;
  constructor(private readonly builder: Builder) {}
  get driver() {
    return this.#driver;
  }
  async start() {
    if (this.#started) {
      throw new Error("Can't 'start' a driver that is already running");
    }
    this.#started = true;
    this.#driver = await this.builder.build();
  }
  async get(url: string | URL) {
    if (!this.#started) {
      throw new Error('Cannot "get" a driver which has not been "start"ed');
    }
    const urlstring = url instanceof URL ? url.href : url;
    await this.#driver.get(urlstring);
  }

  async quit() {
    if (!this.#started) {
      throw new Error('Cannot "quit" a driver which has not been "start"ed');
    }
    return this.#driver.quit();
  }
}
/**
 * Entry point for launching a Page Object scenario.
 * @param urlOrDriverBuilder If a string is provided, it will be used as the base URL of the
 *                    website to launch. If a webdriver Builder is provided, the url assigned
 *                    by the environment variable 'SELENIUM_BASE_URL' will be used.
 * @param driverBuilder Required if the {@see urlOrDriver} is a string, unnecessary if a WebDriver Builder instance
 * @returns An object containing a `Browse` function to assemble your Page Objects
 *          and allow execution.
 */
export function Site(
  urlOrDriverBuilder: string | Builder | DriverProxy,
  driverBuilder?: Builder | DriverProxy
): Website {
  if (
    !process.env.SELENIUM_BASE_URL &&
    urlOrDriverBuilder instanceof WebDriver
  ) {
    throw new Error(`Tried to call 'Site' without a url (driver only)`);
  }
  if (
    typeof urlOrDriverBuilder != typeof 'string' &&
    !(urlOrDriverBuilder instanceof Builder)
  ) {
    throw new Error(
      `First parameter of 'Site' must be a url string or a WebDriver. Instead found a ${typeof urlOrDriverBuilder}. C'mon man.`
    );
  }
  let url = urlOrDriverBuilder as string;
  if (process.env.SELENIUM_BASE_URL) {
    url = process.env.SELENIUM_BASE_URL;
  }
  return new Website(url, driverBuilder ?? (urlOrDriverBuilder as Builder));
}

export class Website {
  #url: string;
  #driver: DriverProxy;
  constructor(url: string, builder: Builder | DriverProxy) {
    this.#driver =
      builder instanceof Builder ? new DriverProxy(builder) : builder;
    this.#url = url;
  }

  /**
   * Loads up a page and assembles the Page Object which
   * will test it. If the webdriver is no yet active, it
   * will be activated here.
   *
   * If the Page Object overrides the `route` property,
   * it will be appended to the url.
   *
   * I.e
   *
   * For the website `http://my-site.com` with a page
   * on route `/my-second-page`
   *
   * ```
   * export class MySecondPage extends WebPage {
   *  override route = 'my-second-page
   * }
   * ```
   * `browse` will load the url `https://my-site.com/my-second-page`
   * @param page The class of the {@see WebPage} to assemble and test
   * @param route If set, the URL will point to this route. If the WebPage route is set, this parameter will take priority
   * @returns An assembled WebPage
   */
  browse = async <T extends WebPage>(page: constructor<T>, route?: string) => {
    await this.#driver.start();
    const pomRoot = WebPage.Render(page, this.#driver.driver);
    const realRoute = route ?? pomRoot.route ?? '';
    const fullUrl = new URL(realRoute, this.#url);
    await pomRoot.visit(fullUrl.toString());
    return pomRoot;
  };

  async start() {
    await this.#driver.start();
  }

  /**
   * Valid but functionally useless implementation to allow
   * for destructuring with `let` statements
   * @param page
   * @returns
   */
  blueprint = <T extends WebPage>(page: constructor<T>) => {
    return new page();
  };
  /**
   * Load a new Page Object without reloading the browser
   * @param page The class of the WebPage to be assembled
   * @returns An assembled WebPage/Page Object
   */
  switch = <T extends WebPage>(page: constructor<T>) => {
    // if (!this.#driver) {
    //   throw new Error(
    //     'Trying to switch pages to ' +
    //       page +
    //       ' with no driver running. Use "browse" instead'
    //   );
    // }
    return WebPage.Render(page, this.#driver.driver);
  };
  auto = <T extends WebPage>(page: constructor<T>) => {
    if (!this.#driver) {
      throw new Error(
        'Trying to switch pages to ' +
          page +
          ' with no driver running. Use "browse" instead'
      );
    }
    return WebPage.Render(page, this.#driver.driver);
  };
  /**
   * Quit the WebDriver.
   */
  leave = async () => {
    if (!this.#driver) {
      throw new Error('Trying to quit an initialized WebDriver');
    }
    await this.#driver?.quit();
    this.#driver = undefined;
  };
}
