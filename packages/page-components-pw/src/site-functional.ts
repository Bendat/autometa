import { Class } from "@autometa/types";
import { WebPage } from "./component";
import { constructComponentOrWebpage } from "./construct-components";
import { Page } from "playwright";
export type WebSitePages<T extends Record<string, WebPage>> = T;
export function Site<T extends Record<string, Class<WebPage>>>(map: T) {
  const cls = class WebSite {
    [key: string]: WebPage;
  };

  return {
    on: (page: Page, baseUrl: string) => {
      const inst = new cls();
      for (const [key, value] of Object.entries(map)) {
        const child = constructComponentOrWebpage(page, value);
        (child as unknown as { baseUrl: string })["baseUrl"] = baseUrl;
        inst[key] = child;
      }
      return inst as WebSitePages<MapTypeToInstance<T>>;
    }
  };
}

type MapTypeToInstance<T extends Record<string, Class<WebPage>>> = {
  [K in keyof T]: InstanceType<T[K]>;
};

export type Website<
  T extends {
    on: (page: Page, baseUrl: string) => WebSitePages<Record<string, WebPage>>;
  }
> = ReturnType<T["on"]>;
