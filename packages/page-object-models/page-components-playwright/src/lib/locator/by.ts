import { Locator, type Page } from '@playwright/test';
import {
  GetByLocatorOptions,
  GetByRoleOptions,
  GetByTextOptions,
  LocatorFactory,
  type Role,
} from './types';

export class By {
  /**
   * The method returns an element locator that can be used to perform actions on this page / frame. Locator is resolved
   * to the element immediately before performing an action, so a series of actions on the same locator can in fact be
   * performed on different DOM elements. That would happen if the DOM structure between those actions has changed.
   *
   * [Learn more about locators](https://playwright.dev/docs/locators).
   * @param selector A selector to use when resolving DOM element.
   * @param options {@link GetByLocatorOptions}
   */
  static locator(
    idString: string,
    options?: GetByLocatorOptions
  ): LocatorFactory {
    return (page: Page | Locator) => page.locator(idString, options);
  }
  /**
   * Locate element by the test id. By default, the `data-testid` attribute is used as a test id. Use
   * [selectors.setTestIdAttribute(attributeName)](https://playwright.dev/docs/api/class-selectors#selectors-set-test-id-attribute)
   * to configure a different test id attribute if necessary.
   *
   * ```js
   * // Set custom test id attribute from @playwright/test config:
   * use: {
   *   testIdAttribute: 'data-pw'
   * }
   * ```
   *
   * @param testId Id to locate the element by.
   */
  static testId(testId: string | RegExp): LocatorFactory {
    return (page: Page | Locator) => page.getByTestId(testId);
  }

  /**
   * Allows locating elements by their title. For example, this method will find the button by its title "Place the
   * order":
   *
   * ```html
   * <button title='Place the order'>Order Now</button>
   * ```
   *
   * @param text Text to locate the element for.
   * @param options {@link GetByTextOptions}
   */
  static title(
    text: string | RegExp,
    options?: GetByTextOptions
  ): LocatorFactory {
    return (page: Page | Locator) => page.getByTitle(text, options);
  }
  /**
   * Allows locating elements that contain given text. Consider the following DOM structure:
   *
   * ```html
   * <div>Hello <span>world</span></div>
   * <div>Hello</div>
   * ```
   *
   * You can locate by text substring, exact string, or a regular expression:
   *
   * ```js
   * // Matches <span>
   * By.text('world')
   *
   * // Matches first <div>
   * By.text('Hello world')
   *
   * // Matches second <div>
   * By.text('Hello', { exact: true })
   *
   * // Matches both <div>s
   * By.text(/Hello/)
   *
   * // Matches second <div>
   * By.text(/^hello$/i)
   * ```
   *
   * See also [locator.filter([options])](https://playwright.dev/docs/api/class-locator#locator-filter) that allows to
   * match by another criteria, like an accessible role, and then filter by the text content.
   *
   * **NOTE** Matching by text always normalizes whitespace, even with exact match. For example, it turns multiple
   * spaces into one, turns line breaks into spaces and ignores leading and trailing whitespace.
   *
   * **NOTE** Input elements of the type `button` and `submit` are matched by their `value` instead of the text content.
   * For example, locating by text `"Log in"` matches `<input type=button value="Log in">`.
   * @param text Text to locate the element for.
   * @param options {@link GetByTextOptions}
   */
  static text(
    text: string | RegExp,
    options?: GetByTextOptions
  ): LocatorFactory {
    return (page: Page | Locator) => page.getByText(text, options);
  }
  /**
   * Allows locating elements by their [ARIA role](https://www.w3.org/TR/wai-aria-1.2/#roles),
   * [ARIA attributes](https://www.w3.org/TR/wai-aria-1.2/#aria-attributes) and
   * [accessible name](https://w3c.github.io/accname/#dfn-accessible-name). Note that role selector **does not replace**
   * accessibility audits and conformance tests, but rather gives early feedback about the ARIA guidelines.
   *
   * Note that many html elements have an implicitly
   * [defined role](https://w3c.github.io/html-aam/#html-element-role-mappings) that is recognized by the role selector.
   * You can find all the [supported roles here](https://www.w3.org/TR/wai-aria-1.2/#role_definitions). ARIA guidelines
   * **do not recommend** duplicating implicit roles and attributes by setting `role` and/or `aria-*` attributes to
   * default values.
   * @param role Required aria role.
   * @param options {@link GetByRoleOptions}
   */
  static role(role: Role, options?: GetByRoleOptions): LocatorFactory {
    return (page: Page | Locator) => page.getByRole(role, options);
  }
  /**
   * Allows locating input elements by the text of the associated label. For example, this method will find the input by
   * label text "Password" in the following DOM:
   *
   * ```html
   * <label for="password-input">Password:</label>
   * <input id="password-input">
   * ```
   *
   * @param text Text to locate the element for.
   * @param options {@link GetByTextOptions}
   */
  static label(label: string, options?: GetByTextOptions): LocatorFactory {
    return (page: Page | Locator) => page.getByLabel(label, options);
  }
  /**
   * Allows locating elements by their alt text. For example, this method will find the image by alt text "Castle":
   *
   * ```html
   * <img alt='Castle'>
   * ```
   *
   * @param text Text to locate the element for.
   * @param options {@link GetByTextOptions}
   */
  static altText(altText: string, options?: GetByTextOptions): LocatorFactory {
    return (page: Page | Locator) => page.getByAltText(altText, options);
  }
  /**
   * Allows locating input elements by the placeholder text. For example, this method will find the input by placeholder
   * "Country":
   *
   * ```html
   * <input placeholder="Country">
   * ```
   *
   * @param text Text to locate the element for.
   * @param options {@link GetByTextOptions}
   */
  static placeHolder(
    placeholder: string,
    options?: GetByTextOptions
  ): LocatorFactory {
    return (page: Page | Locator) =>
      page.getByPlaceholder(placeholder, options);
  }
}
