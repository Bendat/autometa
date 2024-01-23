import { Browser, BrowserContextOptions, BrowserType, Page } from "playwright";
import { WebPage } from "./component";
import { constructComponentOrWebpage } from "./construct-components";

class BrowserLauncher {
  #browserType: BrowserType;
  #contextOptions: Parameters<BrowserType["launch"]>[0];
  #url: string;
  #launchOptions: Parameters<BrowserType["launch"]>[0];
  #pageOptions: Parameters<Browser["newPage"]>[0];
  #browser: Browser;
  #closeables: { close: () => Promise<void> }[] = [];
  constructor(browser: BrowserType) {
    this.#browserType = browser;
  }

  with(context?: BrowserContextOptions) {
    this.#contextOptions = context;
    return this;
  }

  at(url: string) {
    this.#url = url;
    return this;
  }

  launchOptions(options?: Parameters<BrowserType["launch"]>[0]) {
    this.#launchOptions = options;
    return this;
  }

  pageOptions(options?: Parameters<Browser["newPage"]>[0]) {
    this.#pageOptions = options;
    return this;
  }

  async launch() {
    this.#browser = await this.#browserType.launch(this.#launchOptions);
    this.#closeables.push(this.#browser);
    const ctx = this.#contextOptions
      ? await this.#browser.newContext(this.#contextOptions)
      : undefined;

    const app = ctx ?? this.#browser;
    const page = await app.newPage(this.#pageOptions);
    const launched = await page.goto(this.#url);
    this.#closeables.push(app);

    return launched;
  }

  closeCurrentContext() {
    if (this.#closeables.length > 1) {
      return this.#closeables.pop()?.close();
    }
    throw new Error(
      "No context to close. Maybe you meant to close the browser?"
    );
  }

  async closeBrowser() {
    await this.#browser.close();
    return this.#closeables.shift()?.close();
  }

  async closeAll() {
    for (const closeable of this.#closeables) {
      await closeable.close();
    }
  }

  #pageConsumerCallbacks: ((page: Page) => void)[] = [];
  $_onPageInitialized(consumer: (page: Page) => void) {
    this.#pageConsumerCallbacks.push(consumer);
  }

  #runPageConsumerCallbacks(page: Page) {
    for (const callback of this.#pageConsumerCallbacks) {
      callback(page);
    }
  }
}

export class Website {
  #browsers: BrowserLauncher[] = [];

  constructor() {
    constructComponentOrWebpage(this);
  }
  open(browser: BrowserType) {
    const launcher = new BrowserLauncher(browser);
    this.#browsers.push(launcher);
    return launcher;
  }

  getBrowser(index = 0) {
    return this.#browsers[index];
  }
}
