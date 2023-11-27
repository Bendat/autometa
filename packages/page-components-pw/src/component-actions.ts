import { Locator } from "playwright";
import { Component } from "./component";
import { Constructable, LocatorOptions } from "./types";
import { Class } from "@autometa/types";
import { makeComponents } from "./construct-components";

/**
 * Actionable Mixin for Components which implements behavior
 * around interacting with an element of a webpage
 * through mouse clicks.
 *
 * Examples of a Clickable Component include:
 * - Button
 * - Anchor
 * @param base - The base class to mix onto. This is an internal detail, but the base is guaranteed to be a Component.
 * @returns A new class which mixes the behavior onto the base class and which can be used through inheritors.
 */
export const Clickable = (base: Constructable) =>
  class Clickable
    extends base
    implements Pick<Locator, "click">, Pick<Locator, "dblclick">
  {
    declare locator: Locator;

    click(opts?: LocatorOptions<"click">) {
      return this.locator.click(opts);
    }

    dblclick(opts?: LocatorOptions<"dblclick">) {
      return this.locator.dblclick(opts);
    }
  };

/**
 * Actionable Mixin for Components which indicates the element
 * contains readable text we care about.
 *
 * Examples of a Readable Component include:
 * - Button
 * - Anchor
 * - Paragraph and other text elements
 * @param base - The base class to mix onto. This is an internal detail, but the base is guaranteed to be a Component.
 * @returns A new class which mixes the behavior onto the base class and which can be used through inheritors.
 */
export const Readable = (base: Constructable) =>
  class Readable extends base implements Pick<Locator, "textContent"> {
    declare locator: Locator;

    textContent(opts?: LocatorOptions<"textContent">): Promise<string | null> {
      return this.locator.textContent(opts);
    }
  };

export const Checkable = (base: Constructable) =>
  class Checkable
    extends base
    implements Pick<Locator, "isChecked" | "check" | "uncheck" | "setChecked">
  {
    declare locator: Locator;

    isChecked() {
      return this.locator.isChecked();
    }
    check(opts?: LocatorOptions<"check">) {
      return this.locator.check(opts);
    }
    uncheck(opts?: LocatorOptions<"uncheck">) {
      return this.locator.uncheck(opts);
    }

    setChecked(value: boolean, opts?: LocatorOptions<"setChecked">) {
      return this.locator.setChecked(value, opts);
    }
  };

export const Clearable = (base: Constructable) =>
  class Clearable extends base implements Pick<Locator, "clear"> {
    declare locator: Locator;

    clear(opts?: LocatorOptions<"clear">) {
      return this.locator.clear(opts);
    }
  };

export const Countable = (base: Constructable) =>
  class Countable extends base implements Pick<Locator, "count"> {
    declare locator: Locator;

    count() {
      return this.locator.count();
    }
  };

export const Blurable = (base: Constructable) =>
  class Blurable extends base implements Pick<Locator, "blur"> {
    declare locator: Locator;

    blur(opts?: LocatorOptions<"blur">) {
      return this.locator.blur(opts);
    }
  };

export const Bounded = (base: Constructable) =>
  class Bounded extends base implements Pick<Locator, "boundingBox"> {
    declare locator: Locator;

    boundingBox(opts?: LocatorOptions<"boundingBox">) {
      return this.locator.boundingBox(opts);
    }
  };

export const Draggable = (base: Constructable) =>
  class Draggable extends base implements Pick<Locator, "dragTo"> {
    declare locator: Locator;

    dragTo(
      target: Locator | Component,
      opts?: LocatorOptions<"dragTo">
    ): Promise<void> {
      const locator = target instanceof Component ? target.locator : target;
      return this.locator.dragTo(locator, opts);
    }
  };

export const Fillable = (base: Constructable) =>
  class Writeable
    extends base
    implements
      Pick<Locator, "fill" | "press" | "inputValue" | "pressSequentially">
  {
    declare locator: Locator;

    fill(value: string, opts?: LocatorOptions<"fill">) {
      return this.locator.fill(value, opts);
    }
    press(key: string, opts?: LocatorOptions<"press">) {
      return this.locator.press(key, opts);
    }

    inputValue(opts: LocatorOptions<"inputValue">) {
      return this.locator.inputValue(opts);
    }

    pressSequentially(
      keys: string,
      opts?: LocatorOptions<"pressSequentially">
    ) {
      return this.locator.pressSequentially(keys, opts);
    }
  };

export const Focusable = (base: Constructable) =>
  class Focusable extends base implements Pick<Locator, "focus"> {
    declare locator: Locator;

    focus(opts?: LocatorOptions<"focus">) {
      return this.locator.focus(opts);
    }
  };

export const Hoverable = (base: Constructable) =>
  class Hoverable extends base implements Pick<Locator, "hover"> {
    declare locator: Locator;

    hover(opts?: LocatorOptions<"hover">) {
      return this.locator.hover(opts);
    }
  };

export const Selectable = (base: Constructable) =>
  class Selectable extends base implements Pick<Locator, "selectOption"> {
    declare locator: Locator;
    selectOption(
      values: string | string[],
      opts?: LocatorOptions<"selectOption">
    ) {
      return this.locator.selectOption(values, opts);
    }
  };

export const ObserveEditable = (base: Constructable) =>
  class IsEditible extends base implements Pick<Locator, "isEditable"> {
    declare locator: Locator;
    isEditable() {
      return this.locator.isEditable();
    }
  };

export const ObserveEnabled = (base: Constructable) =>
  class IsDisabled
    extends base
    implements Pick<Locator, "isDisabled" | "isEnabled">
  {
    declare locator: Locator;
    isDisabled(options: LocatorOptions<"isDisabled">) {
      return this.locator.isEnabled(options);
    }

    isEnabled(options: LocatorOptions<"isEnabled">) {
      return this.locator.isEnabled(options);
    }
  };

export const ObserveVisible = (base: Constructable) =>
  class IsVisible extends base implements Pick<Locator, "isVisible"> {
    declare locator: Locator;
    isVisible() {
      return this.locator.isVisible();
    }
    isHidden() {
      return this.locator.isHidden();
    }
  };

export const Pressable = (base: Constructable) =>
  class Pressable extends base implements Pick<Locator, "press"> {
    declare locator: Locator;
    press(key: string, opts?: LocatorOptions<"press">) {
      return this.locator.press(key, opts);
    }
  };

export const Scrollable = (base: Constructable) =>
  class Scrollable
    extends base
    implements Pick<Locator, "scrollIntoViewIfNeeded">
  {
    declare locator: Locator;
    scrollIntoViewIfNeeded(opts?: LocatorOptions<"scrollIntoViewIfNeeded">) {
      return this.locator.scrollIntoViewIfNeeded(opts);
    }
  };

export const Tappable = (base: Constructable) =>
  class Tappable extends base implements Pick<Locator, "tap"> {
    declare locator: Locator;
    tap(opts?: LocatorOptions<"tap">) {
      return this.locator.tap(opts);
    }
  };

export const Iterable = (base: Constructable) =>
  class Iterable extends base {
    declare locator: Locator;
    nth<T extends Component>(cls: Class<T>, index: number): T {
      const locator = this.locator.nth(index);
      return makeComponents(cls, this.page, locator) as T;
    }

    first<T extends Component>(cls: Class<T>): T {
      const locator = this.locator.first();
      return makeComponents(cls, this.page, locator) as T;
    }

    last<T extends Component>(cls: Class<T>): T {
      const locator = this.locator.last();
      return makeComponents(cls, this.page, locator) as T;
    }

    of<T extends Component>(cls: Class<T>) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      return {
        async *[Symbol.asyncIterator]() {
          for (let i = 0; i < (await self.locator.count()); i++) {
            yield self.nth(cls, i);
          }
        }
      };
    }
  };
