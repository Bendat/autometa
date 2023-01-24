import { Locator } from '@playwright/test';
export interface FindByTextOptions {
  /**
   * Whether to find an exact match: case-sensitive and whole-string. Default to false. Ignored when locating by a
   * regular expression. Note that exact match still trims whitespace.
   */
  exact?: boolean;
}
export interface Options {
  /**
   * Maximum time in milliseconds, defaults to 30 seconds, pass `0` to disable timeout. The default value can be changed
   * by using the
   * [browserContext.setDefaultTimeout(timeout)](https://playwright.dev/docs/api/class-browsercontext#browser-context-set-default-timeout)
   * or [page.setDefaultTimeout(timeout)](https://playwright.dev/docs/api/class-page#page-set-default-timeout) methods.
   */
  timeout?: number;
}
export interface EventOptions extends Options {
  /**
   * When true, the call requires selector to resolve to a single element. If given selector resolves to more than one
   * element, the call throws an exception.
   */
  strict?: boolean;
}
export type SetFileWithMimeTypes = {
  /**
   * File name
   */
  name: string;

  /**
   * File type
   */
  mimeType: string;

  /**
   * File content
   */
  buffer: Buffer;
};
export type SetFileArgs =
  | string
  | Array<string>
  | SetFileWithMimeTypes
  | Array<SetFileWithMimeTypes>;

export interface SetInputFilesOptions extends Options {
  /**
   * Actions that initiate navigations are waiting for these navigations to happen and for pages to start loading. You
   * can opt out of waiting via setting this flag. You would only need this option in the exceptional cases such as
   * navigating to inaccessible pages. Defaults to `false`.
   */
  noWaitAfter?: boolean;
}

export interface LocatorOptions extends Options {
  /**
   * Whether to bypass the [actionability](https://playwright.dev/docs/actionability) checks. Defaults to `false`.
   */
  force?: boolean;

  /**
   * Actions that initiate navigations are waiting for these navigations to happen and for pages to start loading. You
   * can opt out of waiting via setting this flag. You would only need this option in the exceptional cases such as
   * navigating to inaccessible pages. Defaults to `false`.
   */
  noWaitAfter?: boolean;
}
export interface WaitForOptions extends Options {
  /**
   * Defaults to `'visible'`. Can be either:
   * - `'attached'` - wait for element to be present in DOM.
   * - `'detached'` - wait for element to not be present in DOM.
   * - `'visible'` - wait for element to have non-empty bounding box and no `visibility:hidden`. Note that element
   *   without any content or with `display:none` has an empty bounding box and is not considered visible.
   * - `'hidden'` - wait for element to be either detached from DOM, or have an empty bounding box or
   *   `visibility:hidden`. This is opposite to the `'visible'` option.
   */
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}
export interface HoverOptions extends LocatorOptions {
  /**
   * Modifier keys to press. Ensures that only these modifiers are pressed during the operation, and then restores
   * current modifiers back. If not specified, currently pressed modifiers are used.
   */
  modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>;

  /**
   * A point to use relative to the top-left corner of element padding box. If not specified, uses some visible point of
   * the element.
   */
  position?: {
    x: number;

    y: number;
  };

  /**
   * When set, this method only performs the [actionability](https://playwright.dev/docs/actionability) checks and skips the action. Defaults
   * to `false`. Useful to wait until the element is ready for the action without performing it.
   */
  trial?: boolean;
}
export interface TypeOptions extends Options {
  /**
   * Time to wait between key presses in milliseconds. Defaults to 0.
   */
  delay?: number;

  /**
   * Actions that initiate navigations are waiting for these navigations to happen and for pages to start loading. You
   * can opt out of waiting via setting this flag. You would only need this option in the exceptional cases such as
   * navigating to inaccessible pages. Defaults to `false`.
   */
  noWaitAfter?: boolean;
}
export interface FilterOptions {
  /**
   * Matches elements containing an element that matches an inner locator. Inner locator is queried against the outer
   * one. For example, `article` that has `text=Playwright` matches `<article><div>Playwright</div></article>`.
   *
   * Note that outer and inner locators must belong to the same frame. Inner locator must not contain [FrameLocator]s.
   */
  has?: Locator;

  /**
   * Matches elements containing specified text somewhere inside, possibly in a child or a descendant element. When
   * passed a [string], matching is case-insensitive and searches for a substring. For example, `"Playwright"` matches
   * `<article><div>Playwright</div></article>`.
   */
  hasText?: string | RegExp;
}
export interface SetCheckedOptions extends LocatorOptions {
  position?: { x: number; y: number };
  trial?: boolean;
}
export interface DoubleClickOptions extends LocatorOptions {
  button?: 'left' | 'right' | 'middle';
  delay?: number;
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
  position?: { x: number; y: number };
  trial?: boolean;
}
export interface DragToOptions extends LocatorOptions {
  sourcePosition?: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  trial?: boolean;
}
export type FillOptions = LocatorOptions;

export interface InteractOptions extends LocatorOptions {
  /**
   * Time to wait between `mousedown` and `mouseup` in milliseconds. Defaults to 0.
   */
  delay?: number;

  /**
   * A point to use relative to the top-left corner of element padding box. If not specified, uses some visible point of
   * the element.
   */
  position?: {
    x: number;

    y: number;
  };
}
export interface ButtonLikeOption extends InteractOptions {
  /**
   * When set, this method only performs the [actionability](https://playwright.dev/docs/actionability) checks and skips the action. Defaults
   * to `false`. Useful to wait until the element is ready for the action without performing it.
   */
  trial?: boolean;
}
export interface ClickOptions extends ButtonLikeOption {
  /**
   * Defaults to `left`.
   */
  button?: 'left' | 'right' | 'middle';

  /**
   * defaults to 1. See [UIEvent.detail].
   */
  clickCount?: number;

  /**
   * Modifier keys to press. Ensures that only these modifiers are pressed during the operation, and then restores
   * current modifiers back. If not specified, currently pressed modifiers are used.
   */
  modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>;
}

export interface TapOptions extends ButtonLikeOption {
  /**
   * Modifier keys to press. Ensures that only these modifiers are pressed during the operation, and then restores
   * current modifiers back. If not specified, currently pressed modifiers are used.
   */
  modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>;
}

export interface PressOptions extends InteractOptions {
  /**
   * Time to wait between `keydown` and `keyup` in milliseconds. Defaults to 0.
   */
  delay?: number;
}
export type CheckOptions = ButtonLikeOption;
