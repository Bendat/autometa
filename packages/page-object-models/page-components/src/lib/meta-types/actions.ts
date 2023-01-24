import { Component } from '.';
import { ElementArray } from '../components/lazy-element-array';
import { ConstructionOptions } from '../types';

/**
 * Action Interface for the methods which
 * expose Seleniums 'click()' method.
 */
export interface ClickOn {
  (): Promise<void>;
}

/**
 * Action Interface for the methods which
 * expose Seleniums 'text()' method.
 */
export interface GetText {
  (): Promise<string>;
}

/**
 * Action Interface for the methods which
 * expose Seleniums 'sendKeys()' method.
 */
export interface SendKeys {
  (...input: (string | number)[]): Promise<void>;
}

export interface Clickable {
  click: ClickOn;
}
export interface Writable {
  type: SendKeys;
}
export interface Readable {
  get text();
}
/**
 * Action Interface for the methods which
 * expose Seleniums 'clear()' method.
 */
export interface Clear {
  (): Promise<void>;
}

/**
 * Action Interface for the methods which
 * expose Seleniums 'submit()' method.
 */
export interface Submit {
  (): Promise<void>;
}

/**
 * Action Interface for the methods which
 * expose Seleniums 'findElement()' method.
 */
export interface FindElement {
  <T extends Component>(
    options: ConstructionOptions<T>,
    name: string
  ): Promise<T>;
}

/**
 * Action Interface for the methods which
 * expose Seleniums 'findElements()' method.
 */
export interface FindElements {
  <T extends Component>(options: ConstructionOptions<T>): ElementArray<T>;
}
