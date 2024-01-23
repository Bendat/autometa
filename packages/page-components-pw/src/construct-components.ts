import { Locator, Page } from "playwright";
import { Component, WebPage } from "./component";
import { Class } from "@autometa/types";
import { ComponentMetadata, PageComponentSymbols } from "./decorators";
import { metadata } from "@autometa/injection";
export function constructComponentOrWebpage<T extends WebPage>(root: T): T;
export function constructComponentOrWebpage<T extends WebPage>(
  root: Class<T>
): T;
export function constructComponentOrWebpage<T extends Component>(
  root: Class<T>,
  locator?: Locator
): T;
export function constructComponentOrWebpage<
  T extends Class<WebPage> | Class<Component>
>(root: T, locator?: Locator) {
  if (root instanceof WebPage) {
    // (root as unknown as Record<string, unknown>)["page"] = page;
    return constructWebPage(root.prototype.constructor, root);
  }
  if (root.prototype instanceof WebPage) {
    const instance = new root() as WebPage;
    // const dict = instance as unknown as Record<string, unknown>;
    // dict["page"] = page;
    constructWebPage(root as Class<WebPage>, instance);
    return instance;
  } else if (root.prototype instanceof Component) {
    const component = makeComponents<T>(root, locator);
    return component;
  }
}

export function makeComponents<T extends Class<WebPage> | Class<Component>>(
  root: T,
  locator: Locator | undefined
) {
  const component = new root() as Component;
  const dict = component as unknown as Record<string, unknown>;
  dict["locator"] = locator;
  constructChildComponents(root as Class<Component>, component, locator);
  return component;
}

function constructWebPage(root: Class<WebPage>, rootInstance: WebPage) {
  constructChildComponents(root, rootInstance, page);
}

export function constructChildComponents(
  driver: Page | Locator,
  root: Class<Component | WebPage>,
  rootInstance: Component | WebPage,
  dynamicLocator?: Locator
) {
  const meta = metadata(root).getCustom<ComponentMetadata>(
    PageComponentSymbols.PAGE_COMPONENTS
  );
  if (!meta) {
    return;
  }
  for (const [key, value] of Object.entries(meta)) {
    const { component, injector } = value;
    if (injector) {
      constructComponent(
        component,
        injector,
        dynamicLocator,
        driver,
        rootInstance,
        key
      );
    }
  }
}
export type SelectorFunction = (driver: Page | Locator) => Locator;

export function constructComponent(
  type: Class<Component>,
  selector: SelectorFunction,
  dynamicLocator: Locator | undefined,
  driver: Page | Locator,
  rootInstance: WebPage | Component,
  key?: string
) {
  const component = new type();
  const locator = selector(dynamicLocator ?? driver);
  const dict = component as unknown as Record<string, unknown>;
  dict["locator"] = locator;
  const rootDict = rootInstance as unknown as Record<string, unknown>;
  if (key) {
    rootDict[key] = component;
  }
  constructChildComponents(locator, type, component, page);
}

export function attachPageToComponents<T extends Component | WebPage>(
  componentOrPage: T,
  page: Page
) {
  const dict = componentOrPage as unknown as Record<string, unknown>;
  dict["page"] = page;
  const meta = metadata(
    componentOrPage.constructor
  ).getCustom<ComponentMetadata>(PageComponentSymbols.PAGE_COMPONENTS);
  const keys = Object.keys(meta);
  for (const key of keys) {
    const child = (componentOrPage as unknown as Record<string, unknown>)[
      key
    ] as Component | WebPage;
    attachPageToComponents(child, page);
  }
  return componentOrPage;
}
