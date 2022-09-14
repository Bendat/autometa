import { WebElement } from 'selenium-webdriver';
import { InjectableComponent } from '../decorators/injectables';
import { Component } from '../meta-types/component';

/**
 * Equivalent to Selenium `WebElement`, exposes
 * most actions available to a Component.
 */
@InjectableComponent()
export class Element extends Component {
  click = this.click;
  clear = this.clear;
  find = this.find;
  findAll = this.findAll;
  get text() {
    return super.text;
  }
  get isVisible(): Promise<boolean> {
    return super.isVisible;
  }
  webElement = (action: (element: WebElement) => Promise<void>) =>
    this._action(action, 'Using Element Directly');
}
