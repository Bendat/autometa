import {
  WebElement,
  Locator,
  WebElementCondition,
  Condition,
} from 'selenium-webdriver';
import { UntilAction } from '../types';

export abstract class UntilCondition {
  #name: string;
  protected action: UntilAction;
  constructor(action: UntilAction, name: string) {
    this.action = action;
    this.#name = name;
  }

  get name() {
    return `Until.${this.#name}`;
  }
  abstract extract(
    element: WebElement,
    locator: Locator,
    ...args: unknown[]
  ): WebElementCondition | Condition<boolean>;
}
