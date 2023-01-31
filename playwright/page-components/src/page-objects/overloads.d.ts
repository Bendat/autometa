import { Class } from "@autometa/shared";
import {
  FindByTextOptions,
  LocatorOptions,
  Options,
  RoleOptions,
} from "./locator-options";
import { SemanticComponent } from ".";
import { Locator } from "@playwright/test";
import { Role } from "../locator";

 /**
   * Allows locating elements by their alt text. Constructs a PageComponent
   * from the locator. The PageComponent type can be controlled
   *
   * **Usage**
   *
   * For example, this method will find the image by alt text "Playwright logo":
   *
   * ```html
   * <img alt='Playwright logo'>
   * ```
   *
   * ```js
   * await page.getByAltText('Playwright logo').click();
   * ```
   *
   * @param text Text to locate the element for.
   * @param options
   */
export interface GetByAltTextOverloads<TDefault extends SemanticComponent> {
  (text: string | RegExp, options?: FindByTextOptions): TDefault;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    type: Class<T>
  ): T;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    options?: FindByTextOptions,
    type?: Class<T>
  ): T;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    options?: FindByTextOptions | Class<T>,
    type?: Class<T>
  ): T;
}
export interface GetByTextOverloads<TDefault extends SemanticComponent> {
  (text: string | RegExp, options?: FindByTextOptions): TDefault;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    type: Class<T>
  ): T;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    options?: FindByTextOptions,
    type?: Class<T>
  ): T;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    options?: FindByTextOptions | Class<T>,
    type?: Class<T>
  ): T;
}
export interface GetByLabelOverloads<TDefault extends SemanticComponent> {
  (text: string | RegExp, options?: FindByTextOptions): TDefault;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    type: Class<T>
  ): T;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    options?: FindByTextOptions,
    type?: Class<T>
  ): T;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    options?: FindByTextOptions | Class<T>,
    type?: Class<T>
  ): T;
}
export interface GetByLocatorOverloads<TDefault extends SemanticComponent> {
  (selector: string, options?: LocatorOptions): TDefault;
  <T extends SemanticComponent = TDefault>(selector: string, type: Class<T>): T;
  <T extends SemanticComponent = TDefault>(
    selector: string,
    options?: LocatorOptions,
    type?: Class<T>
  ): T;
  <T extends SemanticComponent = TDefault>(
    selector: string,
    options?: LocatorOptions | Class<T>,
    type?: Class<T>
  ): T;
}
export interface GetByPlaceholderOverloads<TDefault extends SemanticComponent> {
  (text: string | RegExp, options?: FindByTextOptions): TDefault;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    type: Class<T>
  ): T;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    options?: FindByTextOptions,
    type?: Class<T>
  ): T;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    options?: FindByTextOptions | Class<T>,
    type?: Class<T>
  ): T;
}

export interface GetByRoleOverloads<TDefault extends SemanticComponent> {
  (text: Role, options?: RoleOptions): TDefault;
  <T extends SemanticComponent = TDefault>(text: Role, type: Class<T>): T;
  <T extends SemanticComponent = TDefault>(
    text: Role,
    options?: RoleOptions,
    type?: Class<T>
  ): T;
  <T extends SemanticComponent = TDefault>(
    text: Role,
    options?: RoleOptions | Class<T>,
    type?: Class<T>
  ): T;
}
export interface GetByTestIdOverloads<TDefault extends SemanticComponent> {
  (text: string | RegExp): TDefault;
  <T extends SemanticComponent = TDefault>(text: string | RegExp): T;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    type: Class<T>
  ): T;
}
export interface GetByTextOverloads<TDefault extends SemanticComponent> {
  (text: string | RegExp, options?: FindByTextOptions): TDefault;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    type: Class<T>
  ): T;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    options?: FindByTextOptions,
    type?: Class<T>
  ): T;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    options?: FindByTextOptions | Class<T>,
    type?: Class<T>
  ): T;
}
export interface GetByTitleOverloads<TDefault extends SemanticComponent> {
  (text: string | RegExp, options?: FindByTextOptions): TDefault;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    type: Class<T>
  ): T;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    options?: FindByTextOptions,
    type?: Class<T>
  ): T;
  <T extends SemanticComponent = TDefault>(
    text: string | RegExp,
    options?: FindByTextOptions | Class<T>,
    type?: Class<T>
  ): T;
}

export interface TransformLocator<TType extends SemanticComponent> {
  <
    T extends SemanticComponent = SemanticComponent,
    K extends Options = Options
  >(
    locator: (...args: any[]) => Locator,
    selector: string | RegExp,
    options?: K | Class<T>,
    type?: Class<T>,
    fallback?: Class<TType>
  ): T;
}
