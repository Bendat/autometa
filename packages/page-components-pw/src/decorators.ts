import "reflect-metadata";
import { Page, Locator } from "playwright";
import { Class } from "@autometa/types";
import { Component, WebPage } from "./component";
import { AriaRoles, LocatorOptions } from "./types";
import { metadata, Inject } from "@autometa/injection";
type Injector = (driver: Page | Locator) => Locator;

export const PageMap = new Map<
  Class<Component>["prototype"] | Class<WebPage>["prototype"],
  Record<string, Class<Component>>
>();

export const InjectorMap = new Map<
  Class<Component>["prototype"] | Class<WebPage>["prototype"],
  Record<string, Injector>
>();
const PAGE_COMPONENTS: unique symbol = Symbol(
  "autometa:meta-data:page-components"
);

export const PageComponentSymbols = {
  PAGE_COMPONENTS
} as const;

export type ComponentMetadata = {
  [key: string]: {
    component: Class<Component>;
    injector: Injector;
  };
};
export function Injectify(component: Class<Component>, injector: Injector) {
  // return (target: object, key: string) => {
  //   const map = PageMap.get(target) ?? {};
  //   map[key] = component;
  //   PageMap.set(target, map);
  //   const injectorMap = InjectorMap.get(target) ?? {};
  //   injectorMap[key] = injector;
  //   InjectorMap.set(target, injectorMap);
  // };

  return (target: object, key: string) => {
    const meta = metadata(getConstructor(target)).custom<ComponentMetadata>(
      PageComponentSymbols.PAGE_COMPONENTS,
      {},
      false
    );
    meta[key] = { component, injector };

  };
}
export function getConstructor(target: unknown) {
  if (target && "constructor" in (target as object)) {
    return target.constructor;
  }
  throw new Error(`Cannot get constructor for ${target}`);
}
export function ByAltText(
  component: Class<Component>,
  text: string | RegExp,
  options?: LocatorOptions<"getByAltText">
) {
  return Injectify(component, (locator: Page | Locator) =>
    locator.getByAltText(text, options)
  );
}

export function ByLabel(
  component: Class<Component>,
  label: string | RegExp,
  options?: LocatorOptions<"getByLabel">
) {
  return Injectify(component, (locator: Page | Locator) =>
    locator.getByLabel(label, options)
  );
}

export function ByFactory(
  component: Class<Component>,
  factory: (locator: Page | Locator) => Locator
) {
  return Injectify(component, factory);
}
export function ByPlaceholder(
  component: Class<Component>,
  placeholder: string | RegExp,
  options?: LocatorOptions<"getByPlaceholder">
) {
  return Injectify(component, (locator: Page | Locator) =>
    locator.getByPlaceholder(placeholder, options)
  );
}

export function ByRole(
  component: Class<Component>,
  role: AriaRoles,
  options?: LocatorOptions<"getByRole">
) {
  return Injectify(component, (locator: Page | Locator) =>
    locator.getByRole(role, options)
  );
}

export function ByTestId(component: Class<Component>, id: string | RegExp) {
  return Injectify(component, (locator: Page | Locator) =>
    locator.getByTestId(id)
  );
}

export function ByText(
  component: Class<Component>,
  text: string | RegExp,
  options?: LocatorOptions<"getByText">
) {
  return Injectify(component, (locator: Page | Locator) =>
    locator.getByText(text, options)
  );
}

export function BySelector(
  component: Class<Component>,
  selector: string,
  options?: LocatorOptions<"locator">
) {
  return Injectify(component, (locator: Page | Locator) =>
    locator.locator(selector, options)
  );
}
export function ByTitle(
  component: Class<Component>,
  title: string | RegExp,
  options?: LocatorOptions<"getByTitle">
) {
  return Injectify(component, (locator: Page | Locator) =>
    locator.getByTitle(title, options)
  );
}
