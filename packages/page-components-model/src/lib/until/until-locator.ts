import { WebElement, Locator } from 'selenium-webdriver';
import { UntilCondition } from './until-condition';

export class UntilLocator extends UntilCondition {
  extract(_: WebElement, locator: Locator, ...args: unknown[]) {
    return this.action(locator, ...args);
  }
}
