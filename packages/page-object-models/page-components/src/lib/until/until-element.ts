import { WebElement, Locator } from 'selenium-webdriver';
import { UntilCondition } from './until-condition';

export class UntilElement extends UntilCondition {
  extract(element: WebElement, _: Locator, ...args: unknown[]) {
    return this.action(element, ...args);
  }
}
