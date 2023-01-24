import { WebElement } from 'selenium-webdriver';
import { InjectableComponent } from '../decorators/injectables';
import {
  Clear,
  ClickOn,
  FindElement,
  FindElements,
} from '../meta-types/actions';
import { Component } from '../meta-types/component';

/**
 * Equivalent to Selenium `WebElement`, exposes
 * most actions available to a Component.
 */
@InjectableComponent()
export class Element extends Component {
  click: ClickOn = this.click;
  clear: Clear = this.clear;
  find: FindElement = this.find;
  findAll: FindElements = this.findAll;
  get text() {
    return this.read();
  }
  get isVisible(): Promise<boolean> {
    return super.isVisible;
  }
  webElement = (action: (element: WebElement) => Promise<void>) =>
    this._action(action, 'Using Element Directly');
}
