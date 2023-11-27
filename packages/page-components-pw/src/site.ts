import { Class } from "@autometa/types";
import {
  Browser,
  BrowserContextOptions,
  BrowserType,
  LaunchOptions,
  Page
} from "playwright";
import { WebPage } from "./component";
import { constructComponentOrWebpage } from "./construct-components";
import { Bind } from "@autometa/bind-decorator";
import { AutomationError } from "@autometa/errors";
export abstract class Website {
  abstract baseUrl: string;
  declare browser: BrowserType;
  private closeables: { close: () => Promise<void> }[] = [];
  static open<T extends Website>(type: Class<T>) {
    return {
      on: (browser: BrowserType) => {
        return {
          with: (context?: BrowserContextOptions) => {
            return {
              at: (url: string) => {
                return {
                  launch: async (
                    options?: LaunchOptions,
                    pageOptions?: Parameters<Browser["newPage"]>[0]
                  ) => {
                    const launched = await browser.launch(options);
                    const ctx = context
                      ? await launched.newContext(context)
                      : undefined;

                    const page = await (ctx ?? launched).newPage(pageOptions);
                    await page.goto(url);
                    const site = new type().init(url, page) as T;
                    ctx && site.closeables.push(ctx);
                    launched && site.closeables.push(launched);
                    return site;
                  }
                };
              }
            };
          }
        };
      }
    };
  }
  @Bind
  async closeContext() {
    if (this.closeables.length > 1) {
      await this.closeables[0].close();
      this.closeables.shift();
      return;
    }
    throw new AutomationError(
      "No context to close. Maybe you meant to close the browser?"
    );
  }
  @Bind
  async close() {
    for (const closeable of this.closeables) {
      await closeable.close();
    }
  }
  private init(baseUrl: string, page: Page) {
    const map = sitePageMap.get(
      this.constructor.prototype as Class<Website>
    ) as Record<string, Class<WebPage>>;
    for (const [key, value] of Object.entries(map)) {
      if (value.prototype instanceof WebPage) {
        const child = constructComponentOrWebpage(page, value);
        (child as unknown as { baseUrl: string })["baseUrl"] = baseUrl;
        (child as unknown as { page: Page })["page"] = page;
        (this as Record<string, unknown>)[key] = child;
      }
    }
    return this;
  }

  goto(page: keyof this): Promise<void>;
  goto(page: Class<WebPage>): Promise<void>;
  @Bind
  goto(page: Class<WebPage> | keyof this) {
    if (typeof page === "string" && page in this) {
      const pageInstance = this[page as keyof this] as WebPage;
      return pageInstance.goto();
    } else if (typeof page === "string") {
      throw new Error(`No page found matching type ${page}`);
    }
    const match = Object.values(this)
      .filter((value) => {
        return value instanceof WebPage;
      })
      .filter((value) => {
        return value.constructor === page;
      })
      .at(0);
    if (!match) {
      throw new Error(
        `No page found matching type ${(page as Class<WebPage>).name}`
      );
    }
    return match.goto();
  }
}

const sitePageMap = new Map<Class<Website>, Record<string, Class<WebPage>>>();
export function Root(type: Class<WebPage>) {
  return (target: any, property: string) => {
    if (!sitePageMap.has(target)) {
      sitePageMap.set(target, {});
    }
    const map = sitePageMap.get(target) as Record<string, Class<WebPage>>;
    map[property] = type;
  };
}

// export function Open<T extends Website>(site: Class<T>) {
//   //   const inst = new site();
//   const map = sitePageMap.get(site) as Record<string, Class<WebPage>>;
//   //   for (const [key, value] of Object.entries(map)) {
//   //     const child = constructComponentOrWebpage(page, value);
//   //     (child as unknown as { baseUrl: string })["baseUrl"] = baseUrl;
//   //     inst[key] = child;
//   //   }
//   return {
//     on: (page: Page, baseUrl: string) => {
//       const inst = new site();
//       for (const [key, value] of Object.entries(map)) {
//         const child = constructComponentOrWebpage(page, value);
//         (child as unknown as { baseUrl: string })["baseUrl"] = baseUrl;
//         (child as unknown as { page: Page })["page"] = page;
//         (inst as Record<string, unknown>)[key] = child;
//       }
//       return inst;
//     }
//   };
// }
