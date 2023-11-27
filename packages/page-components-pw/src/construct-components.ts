import { Locator, Page } from "playwright";
import { Component, WebPage } from "./component";
import { Class } from "@autometa/types";
import { InjectorMap, PageMap } from "./decorators";
export function constructComponentOrWebpage<T extends WebPage>(
  page: Page,
  root: Class<T>
): T;
export function constructComponentOrWebpage<T extends Component>(
  page: Page,
  root: Class<T>,
  locator?: Locator
): T;
export function constructComponentOrWebpage<
  T extends Class<WebPage> | Class<Component>
>(page: Page, root: T, locator?: Locator) {
  if (root.prototype instanceof WebPage) {
    const instance = new root() as WebPage;
    const dict = instance as unknown as Record<string, unknown>;
    dict["page"] = page;
    constructWebPage(page, root as Class<WebPage>, instance);
    return instance;
  } else if (root.prototype instanceof Component) {
    const component = makeComponents<T>(root, page, locator);
    return component;
  }
}

export function makeComponents<T extends Class<WebPage> | Class<Component>>(
  root: T,
  page: Page,
  locator: Locator | undefined
) {
  const component = new root() as Component;
  const dict = component as unknown as Record<string, unknown>;
  dict["locator"] = locator;
  dict["page"] = page;
  constructChildComponents(
    page,
    root as Class<Component>,
    component,
    page,
    locator
  );
  return component;
}

function constructWebPage(
  page: Page,
  root: Class<WebPage>,
  rootInstance: WebPage
) {
  constructChildComponents(page, root, rootInstance, page);
}

export function constructChildComponents(
  driver: Page | Locator,
  root: Class<Component | WebPage>,
  rootInstance: Component | WebPage,
  page: Page,
  dynamicLocator?: Locator
) {
  const map = PageMap.get(root.prototype);
  if (!map) {
    return;
  }
  for (const [key, value] of Object.entries(map)) {
    const selector = InjectorMap.get(root.prototype)?.[key];
    if (selector) {
      constructComponent(
        value,
        selector,
        dynamicLocator,
        driver,
        page,
        rootInstance,
        key
      );
    }
  }
}
export function constructComponent(
  type: Class<Component>,
  selector: (driver: Page | Locator) => Locator,
  dynamicLocator: Locator | undefined,
  driver: Page | Locator,
  page: Page,
  rootInstance: WebPage | Component,
  key?: string
) {
  const component = new type();
  const locator = selector(dynamicLocator ?? driver);
  const dict = component as unknown as Record<string, unknown>;
  dict["locator"] = locator;
  dict["page"] = page;
  const rootDict = rootInstance as unknown as Record<string, unknown>;
  if(key){
    rootDict[key] = component;
  }
  constructChildComponents(locator, type, component, page);
}
