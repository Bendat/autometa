import { Locator, Page } from "playwright";
import {
  Clickable,
  Countable,
  Fillable,
  Focusable,
  Iterable,
  ObserveEditable,
  ObserveEnabled,
  Pressable,
  Readable,
  Tappable
} from "./component-actions";
import { Behavior } from "./mixins";
import { LocatorOptions } from "./types";
import { Component } from "./component";
import { makeComponents } from "./construct-components";
import { Class } from "@autometa/types";
export class Button extends Behavior(
  Clickable,
  Readable,
  ObserveEnabled,
  Tappable,
  Focusable
) {}

export class TextInput extends Behavior(
  Clickable,
  Readable,
  ObserveEnabled,
  Fillable,
  Pressable,
  Tappable,
  Focusable,
  ObserveEditable
) {
  get content() {
    return this.locator.inputValue();
  }
}

export class FileInput
  extends Behavior(Readable, ObserveEnabled, ObserveEditable)
  implements Pick<Locator, "setInputFiles">
{
  declare locator: Locator;

  setInputFiles(
    files: string | string[],
    opts?: LocatorOptions<"setInputFiles">
  ) {
    return this.locator.setInputFiles(files, opts);
  }
}

export class Text
  extends Behavior(Readable)
  implements Pick<Locator, "textContent">
{
  declare locator: Locator;

  textContent(
    options?: { timeout?: number | undefined } | undefined
  ): Promise<string | null> {
    return this.locator.textContent(options);
  }
}

export class Anchor extends Behavior(Readable, Clickable) {
  declare locator: Locator;

  get href() {
    return this.locator.getAttribute("href");
  }
}

export class Image extends Behavior(Readable) {
  get alt() {
    return this.locator.getAttribute("alt");
  }

  get src() {
    return this.locator.getAttribute("src");
  }

  get title() {
    return this.locator.getAttribute("title");
  }
}

export class AnchorImage
  extends Behavior(Readable, Clickable)
  implements Anchor, Image
{
  get href() {
    return this.locator.getAttribute("href");
  }
  get alt() {
    return this.locator.getAttribute("alt");
  }

  get src() {
    return this.locator.getAttribute("src");
  }

  get title() {
    return this.locator.getAttribute("title");
  }
}

export class AssortmentComponent extends Behavior(Countable, Iterable) {}

export abstract class CollectionComponent<T extends Component> extends Behavior(
  Countable
) {
  abstract childType: Class<T>;
  nth(index: number): T {
    const locator = this.locator.nth(index);
    return makeComponents(this.childType, this.page, locator) as T;
  }

  first(): T {
    const locator = this.locator.first();
    return makeComponents(this.childType, this.page, locator) as T;
  }

  last(): T {
    const locator = this.locator.last();
    return makeComponents(this.childType, this.page, locator) as T;
  }

  get by() {
    const page = this.page;
    const childType = this.childType;
    return {
      selector: (
        selector: string,
        options?: Parameters<Page["locator"]>[1],
        parent?: Component
      ) => {
        const locator = (parent ?? this).locator.locator(selector, options);
        return makeComponents(childType, page, locator) as T;
      },
      role: (
        role: Parameters<Locator["getByRole"]>[0],
        options?: Parameters<Locator["getByRole"]>[1],
        parent?: Component
      ) => {
        const locator = (parent ?? this).locator.getByRole(role, options);
        return makeComponents(childType, page, locator) as T;
      },
      label: (
        text: string | RegExp,
        options?: Parameters<Locator["getByLabel"]>[1],
        parent?: Component
      ) => {
        const locator = (parent ?? this).locator.getByLabel(text, options);
        return makeComponents(childType, page, locator) as T;
      },
      text: (
        selector: Parameters<Locator["getByText"]>[0],
        parent?: Component
      ) => {
        const locator = (parent ?? this).locator.getByText(selector);
        return makeComponents(childType, page, locator) as T;
      },
      title: (
        selector: Parameters<Locator["getByTitle"]>[0],
        parent?: Component
      ) => {
        const locator = (parent ?? this).locator.getByTitle(selector);
        return makeComponents(childType, page, locator) as T;
      },
      testId: (
        selector: Parameters<Locator["getByTestId"]>[0],
        parent?: Component
      ) => {
        const locator = (parent ?? this).locator.getByTestId(selector);
        return makeComponents(childType, page, locator) as T;
      },
      placeholder: (
        selector: Parameters<Locator["getByPlaceholder"]>[0],
        parent?: Component
      ) => {
        const locator = (parent ?? this).locator.getByPlaceholder(selector);
        return makeComponents(childType, page, locator) as T;
      }
    };
  }

  async *[Symbol.asyncIterator]() {
    for (let i = 0; i < (await this.locator.count()); i++) {
      yield this.nth(i);
    }
  }
}
