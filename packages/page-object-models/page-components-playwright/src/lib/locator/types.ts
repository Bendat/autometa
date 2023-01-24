import { Locator, Page } from "@playwright/test";
export type LocatorFactory = (page: Page | Locator) => Locator;

export type Role =
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'blockquote'
  | 'button'
  | 'caption'
  | 'cell'
  | 'checkbox'
  | 'code'
  | 'columnheader'
  | 'combobox'
  | 'complementary'
  | 'contentinfo'
  | 'definition'
  | 'deletion'
  | 'dialog'
  | 'directory'
  | 'document'
  | 'emphasis'
  | 'feed'
  | 'figure'
  | 'form'
  | 'generic'
  | 'grid'
  | 'gridcell'
  | 'group'
  | 'heading'
  | 'img'
  | 'insertion'
  | 'link'
  | 'list'
  | 'listbox'
  | 'listitem'
  | 'log'
  | 'main'
  | 'marquee'
  | 'math'
  | 'meter'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'navigation'
  | 'none'
  | 'note'
  | 'option'
  | 'paragraph'
  | 'presentation'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'scrollbar'
  | 'search'
  | 'searchbox'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'strong'
  | 'subscript'
  | 'superscript'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tablist'
  | 'tabpanel'
  | 'term'
  | 'textbox'
  | 'time'
  | 'timer'
  | 'toolbar'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem';

export type GetByTextOptions = {
  /**
   * Whether to find an exact match: case-sensitive and whole-string. Default to false. Ignored when locating by a
   * regular expression. Note that exact match still trims whitespace.
   */
  exact?: boolean;
};

export type GetByRoleOptions = {
  /**
   * An attribute that is usually set by `aria-checked` or native `<input type=checkbox>` controls.
   *
   * Learn more about [`aria-checked`](https://www.w3.org/TR/wai-aria-1.2/#aria-checked).
   */
  checked?: boolean;

  /**
   * An attribute that is usually set by `aria-disabled` or `disabled`.
   *
   * **NOTE** Unlike most other attributes, `disabled` is inherited through the DOM hierarchy. Learn more about
   * [`aria-disabled`](https://www.w3.org/TR/wai-aria-1.2/#aria-disabled).
   */
  disabled?: boolean;

  /**
   * Whether `name` is matched exactly: case-sensitive and whole-string. Defaults to false. Ignored when `name` is a
   * regular expression. Note that exact match still trims whitespace.
   */
  exact?: boolean;

  /**
   * An attribute that is usually set by `aria-expanded`.
   *
   * Learn more about [`aria-expanded`](https://www.w3.org/TR/wai-aria-1.2/#aria-expanded).
   */
  expanded?: boolean;

  /**
   * Option that controls whether hidden elements are matched. By default, only non-hidden elements, as
   * [defined by ARIA](https://www.w3.org/TR/wai-aria-1.2/#tree_exclusion), are matched by role selector.
   *
   * Learn more about [`aria-hidden`](https://www.w3.org/TR/wai-aria-1.2/#aria-hidden).
   */
  includeHidden?: boolean;

  /**
   * A number attribute that is usually present for roles `heading`, `listitem`, `row`, `treeitem`, with default values
   * for `<h1>-<h6>` elements.
   *
   * Learn more about [`aria-level`](https://www.w3.org/TR/wai-aria-1.2/#aria-level).
   */
  level?: number;

  /**
   * Option to match the [accessible name](https://w3c.github.io/accname/#dfn-accessible-name). By default, matching is
   * case-insensitive and searches for a substring, use `exact` to control this behavior.
   *
   * Learn more about [accessible name](https://w3c.github.io/accname/#dfn-accessible-name).
   */
  name?: string | RegExp;

  /**
   * An attribute that is usually set by `aria-pressed`.
   *
   * Learn more about [`aria-pressed`](https://www.w3.org/TR/wai-aria-1.2/#aria-pressed).
   */
  pressed?: boolean;

  /**
   * An attribute that is usually set by `aria-selected`.
   *
   * Learn more about [`aria-selected`](https://www.w3.org/TR/wai-aria-1.2/#aria-selected).
   */
  selected?: boolean;
};

export type GetByLocatorOptions = {
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
};
