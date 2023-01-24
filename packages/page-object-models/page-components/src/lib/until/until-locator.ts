import {
  WebElement,
  Locator,
  WebElementCondition,
  Condition,
} from 'selenium-webdriver';
import { UntilCondition } from './until-condition';

export class UntilLocator extends UntilCondition {
  extract(
    _: WebElement,
    locator: Locator,
    ...args: unknown[]
  ): WebElementCondition | Condition<boolean> {
    return this.action(locator, ...args);
  }
}
