import { WebElement, Locator } from 'selenium-webdriver';
import { UntilCondition } from './until-condition';

export class UntilArgs extends UntilCondition {
  extract(_: WebElement, __: Locator, ...args: unknown[]) {
    return this.action(...args);
  }
}
