import {
  Locator,
  LocatorScreenshotOptions,
  Page,
  PageScreenshotOptions
} from "playwright";
import { LocatorOptions } from "./types";
import {
  constructComponent,
  constructComponentOrWebpage
} from "./construct-components";
import { Class } from "@autometa/types";
import { expect } from "playwright/test";
export class Component implements Pick<Locator, "screenshot" | "waitFor"> {
  readonly locator: Locator;
  protected readonly page: Page;
  /**
   * Construct a new chid Component based on it's type
   * and a locator. Optionally, if a property key is provided,
   * the component will be attached to this instance indexed
   * by the property key.
   *
   * Example:
   * ```ts
   * class MyComponent extends Component {
   *  getWidgetFromList(index: number){
   *    return this.build(
   *       Widget,
   *       (driver) => driver.locator(`.widget:nth-child(${index})`),
   *       "widget"
   *    );
   *  }
   * }
   * ```
   * @param type The type of the component to construct
   * @param pwLocator A function that returns a Playwright Locator, which can access the current components locator
   * as a parent.
   * @param ownPropertyKey Optional. If provided, the resulting value will be attached to this component instance
   * indexed by this string
   * @returns A new instance of the specified component.
   */
  protected build<T extends Component>(
    type: Class<T>,
    pwLocator: (driver: Page | Locator) => Locator,
    ownPropertyKey?: string
  ) {
    return constructComponent(
      type,
      pwLocator,
      this.locator,
      this.locator,
      this.page,
      this,
      ownPropertyKey
    );
  }

  screenshot(options?: LocatorScreenshotOptions | undefined): Promise<Buffer> {
    return this.locator.screenshot(options);
  }

  waitFor(options?: LocatorOptions<"waitFor", 0>): Promise<void> {
    return this.locator.waitFor(options);
  }

  get expect(): ReturnType<typeof expect<Locator>> {
    return expect(this.locator);
  }
}

export abstract class WebPage implements Pick<Page, "screenshot" | "close"> {
  private declare baseUrl: string;
  abstract readonly route: string;
  readonly page: Page;
  protected build = constructComponentOrWebpage;
  screenshot(options?: PageScreenshotOptions | undefined): Promise<Buffer> {
    return this.page.screenshot(options);
  }

  close(
    options?: { runBeforeUnload?: boolean | undefined } | undefined
  ): Promise<void> {
    return this.page.close(options);
  }

  goto() {
    const url = new URL(this.route, this.baseUrl);
    return this.page.goto(url.href);
  }

  get wait(): {
    forUrl: Page["waitForURL"];
    forLoadState: Page["waitForLoadState"];
    forSelector: Page["waitForSelector"];
    forEvent: Page["waitForEvent"];
  } {
    const page = this.page;
    return {
      forUrl: page.waitForURL.bind(page),
      forLoadState: page.waitForLoadState.bind(page),
      forSelector: page.waitForSelector.bind(page),
      forEvent: page.waitForEvent.bind(page)
    };
  }
}

export class DynamicPage extends WebPage {
  route = "";
}
