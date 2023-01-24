import { Builder, WebDriver } from 'selenium-webdriver';
import { constructor } from 'tsyringe/dist/typings/types';
import { URL } from 'url';
import { WebPage } from './meta-types/web-page';

export class WindowHandle {
  constructor(
    public readonly type: string,
    public readonly handle: string,
    public readonly owner?: unknown
  ) {}
}
export interface WindowGroup {
  [key: string]: WindowHandle;
}
export class WebBrowser {
  #started = false;
  #driver: WebDriver;
  windows: WindowGroup = {};

  constructor(private readonly builder: Builder) {}
  get driver() {
    return this.#driver;
  }
  #currentHandle: string;
  #lastHandle: string;

  get lastHandle() {
    return this.#lastHandle;
  }
  get window() {
    return {
      get handle() {
        return this.driver.getWindowHandle();
      },
      get handles() {
        return this.driver.getAllWindowHandles();
      },
      open: async (
        name: string,
        type: 'tab' | 'window',
        url?: string | URL,
        owner?: unknown
      ) => {
        const urlString = url instanceof URL ? url.href : url;
        await this.driver.switchTo().newWindow(type);
        if (url) {
          await this.driver.get(urlString);
        }
        const created = await this.driver.getWindowHandle();
        this.windows[name] = new WindowHandle(type, created, owner);
        this.#lastHandle = this.#currentHandle;
        this.#currentHandle = created;
        return created;
      },
      switchTo: {
        named: async (name: string) => {
          const window = this.windows[name].handle;
          await this.driver.switchTo().window(window);
          this.#lastHandle = this.#currentHandle;
          this.#currentHandle = window;
          return window;
        },
        handle: async (handle: string) => {
          await this.driver.switchTo().window(handle);
          this.#lastHandle = handle;
          this.#lastHandle = this.#currentHandle;
          this.#currentHandle = handle;
          return handle;
        },
        next: async (cacheName?: string, owner?: unknown) => {
          const handles: string[] = await this.driver.getAllWindowHandles();
          const currentHandle = await this.driver.getWindowHandle();
          const currentIndex = handles.findIndex((it) => it === currentHandle);
          const next =
            currentIndex + 1 >= handles.length ? 0 : currentIndex + 1;
          await this.driver.switchTo().window(handles[next]);
          const selected = await this.driver.getWindowHandle();
          if (cacheName) {
            this.windows[cacheName] = new WindowHandle('tab', selected, owner);
          }
          this.#lastHandle = this.#currentHandle;
          this.#currentHandle = selected;
          return selected;
        },

        titleIs: async (title: string, cacheName?: string, owner?: unknown) => {
          const handles: string[] = await this.driver.getAllWindowHandles();
          for (const handle in handles) {
            const pageTitle = await this.driver.getTitle();
            if (title === pageTitle) {
              this.windows[cacheName] = new WindowHandle('tab', handle, owner);
              this.#lastHandle = this.#currentHandle;
              this.#currentHandle = handle;
              return;
            }
          }
          throw new Error(`No tab was found with title '${title}'`);
        },

        titleMatches: async (
          title: RegExp,
          cacheName?: string,
          owner?: unknown
        ) => {
          const handles: string[] = await this.driver.getAllWindowHandles();
          for (const handle in handles) {
            await this.driver.switchTo().window(handle);
            const pageTitle = await this.driver.getTitle();
            if (pageTitle.match(title).length > 0) {
              this.#lastHandle = this.#currentHandle;
              this.#currentHandle = handle;
              this.windows[cacheName] = new WindowHandle('tab', handle, owner);
              return;
            }
          }
          throw new Error(`No tab was found with title matching'${title}'`);
        },

        titleContains: async (
          title: string,
          cacheName?: string,
          owner?: unknown
        ) => {
          const handles: string[] = await this.driver.getAllWindowHandles();
          for (const handle in handles) {
            await this.driver.switchTo().window(handle);
            const pageTitle = await this.driver.getTitle();
            if (pageTitle.includes(title)) {
              this.windows[cacheName] = new WindowHandle('tab', handle, owner);
              this.#lastHandle = this.#currentHandle;
              this.#currentHandle = handle;
              return;
            }
          }
          throw new Error(`No tab was found with title containing'${title}'`);
        },

        urlIs: async (
          url: string | URL,
          cacheName?: string,
          owner?: unknown
        ) => {
          const urlString = url instanceof URL ? url.href : url;
          const handles: string[] = await this.driver.getAllWindowHandles();
          for (const handle in handles) {
            await this.driver.switchTo().window(handle);

            const pageUrl = await this.driver.getCurrentUrl();
            if (urlString === pageUrl) {
              this.windows[cacheName] = new WindowHandle('tab', handle, owner);
              this.#lastHandle = this.#currentHandle;
              this.#currentHandle = handle;
              return;
            }
          }
          throw new Error(`No tab was found with title '${url}'`);
        },
        urlMatches: async (
          url: string | URL,
          cacheName?: string,
          owner?: unknown
        ) => {
          const urlString = url instanceof URL ? url.href : url;

          const handles: string[] = await this.driver.getAllWindowHandles();
          for (const handle in handles) {
            await this.driver.switchTo().window(handle);

            const pageUrl = await this.driver.getCurrentUrl();

            if (pageUrl.match(urlString).length > 0) {
              this.windows[cacheName] = new WindowHandle('tab', handle, owner);
              this.#lastHandle = this.#currentHandle;
              this.#currentHandle = handle;
              return;
            }
          }
          throw new Error(`No tab was found with url matching'${url}'`);
        },
        urlContains: async (
          url: string | URL,
          cacheName?: string,
          owner?: unknown
        ) => {
          const urlString = url instanceof URL ? url.href : url;

          const handles: string[] = await this.driver.getAllWindowHandles();
          for (const handle in handles) {
            await this.driver.switchTo().window(handle);

            const pageTitle = await this.driver.getCurrentUrl();
            if (pageTitle.includes(urlString)) {
              this.windows[cacheName] = new WindowHandle('tab', handle, owner);
              this.#lastHandle = this.#currentHandle;
              this.#currentHandle = handle;
              return;
            }
          }
          throw new Error(`No tab was found with url containing'${url}'`);
        },
      },
      // switchTo: (name: string)=>{

      // },
      get: (url: string) => this.driver.get(url),
    };
  }
  async start(owner?: unknown) {
    if (this.#started) {
      throw new Error("Can't 'start' a driver that is already running");
    }
    this.#started = true;
    this.#driver = await this.builder.build();
    const handle = await this.driver.getWindowHandle();
    this.#currentHandle = handle;
    this.windows.initial = new WindowHandle('window', handle, owner);
  }

  async get(url: string | URL) {
    if (!this.#started) {
      throw new Error('Cannot "get" a driver which has not been "start"ed');
    }
    const urlstring = url instanceof URL ? url.href : url;
    await this.#driver.get(urlstring);
  }
  async close() {
    return this.#driver.close();
  }
  async quit() {
    await this.#driver.quit();
    this.#started = false;
  }

  site = Site;
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
  urlOrDriverBuilder: string | URL | Builder | WebBrowser,
  driverBuilder?: Builder | WebBrowser
): Website {
  if (
    !process.env.SELENIUM_BASE_URL &&
    urlOrDriverBuilder instanceof WebDriver
  ) {
    throw new Error(`Tried to call 'Site' without a url (driver only)`);
  }
  if (
    typeof urlOrDriverBuilder != typeof 'string' &&
    !(urlOrDriverBuilder instanceof Builder) &&
    !(urlOrDriverBuilder instanceof URL)
  ) {
    throw new Error(
      `First parameter of 'Site' must be a url string or a WebDriver. Instead found a ${typeof urlOrDriverBuilder}:\n${urlOrDriverBuilder}`
    );
  }
  let url = urlOrDriverBuilder as string;
  if (process.env.SELENIUM_BASE_URL) {
    url = process.env.SELENIUM_BASE_URL;
  }
  const asUrlObj = new URL(url);
  return new Website(
    asUrlObj,
    driverBuilder ?? (urlOrDriverBuilder as Builder)
  );
}

export class Website {
  #url: URL;
  #driver: WebBrowser;
  constructor(
    public readonly url: string | URL,
    builder: Builder | WebBrowser
  ) {
    this.#driver =
      builder instanceof Builder ? new WebBrowser(builder) : builder;
    if (typeof url === 'string') {
      this.#url = new URL(url);
    } else {
      this.#url = url;
    }
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
    await pomRoot.visit(fullUrl.href);
    return pomRoot;
  };

  async start() {
    await this.#driver.start();
    await this.#driver.get(this.#url);
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
    await this.#driver?.quit();
  };
}
