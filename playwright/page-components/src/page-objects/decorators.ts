import { Class } from "@autometa/shared";
import { FrameLocator, Locator } from "@playwright/test";
import {
  By,
  GetByLocatorOptions,
  GetByRoleOptions,
  GetByTextOptions,
  LocatorFactory,
  Role,
} from "../locator";
import { Component } from "./component";
import { PageComponent } from "./page-component";

// export function WrapComponent(_, key, descriptor: PropertyDescriptor) {
//   const originalDescriptor = descriptor.value;
//   const fn = {
//     [key]: async function (...args: unknown[]) {
//       const result: Locator = await originalDescriptor.call(this, ...args);
//       const options?: PageComponentOptions = { locator: result, parent: this };
//       return new PageComponent(options);
//     },
//   };
//   descriptor.value = fn[key];
// }
export interface DecoratedProperty<T extends Component> {
  property: string;
  type: Class<T>;
}
export const locatorMetakey = "page-component:locator";
export function getOrCreatePropertyList<T extends PageComponent>(
  target: Class<T>
): DecoratedProperty<Component>[] {
  const key = "page-component:components:list";
  if (Reflect.hasMetadata(key, target)) {
    return Reflect.getMetadata(key, target);
  }
  const array: DecoratedProperty<Component>[] = [];
  Reflect.defineMetadata(key, array, target);
  return array;
}

function defineDecorator(locator: LocatorFactory<Locator | FrameLocator>) {
  return (target: any, key: any) => {
    getOrCreatePropertyList(target).push({
      property: key,
      type: Reflect.getMetadata("design:type", target, key),
    });
    Reflect.defineMetadata(locatorMetakey, locator, target, key);
  };
}

export function Aria(role: Role, options?: GetByRoleOptions) {
  return defineDecorator(By.role(role, options));
}
export function ByFrame(selector: string) {
  return defineDecorator(By.frameLocator(selector));
}
export function ByAltText(text: string, options?: GetByTextOptions) {
  return defineDecorator(By.altText(text, options));
}
export function ByPlaceholder(text: string, options?: GetByTextOptions) {
  return defineDecorator(By.placeHolder(text, options));
}

export function ByText(text: string, options?: GetByTextOptions) {
  return defineDecorator(By.text(text, options));
}

export function ByTitle(text: string, options?: GetByTextOptions) {
  return defineDecorator(By.title(text, options));
}

export function ByLabel(text: string, options?: GetByTextOptions) {
  return defineDecorator(By.label(text, options));
}

export function ByTestId(testId: string) {
  return defineDecorator(By.testId(testId));
}

export function ByLocator(locator: string, options?: GetByLocatorOptions) {
  return defineDecorator(By.locator(locator, options));
}
