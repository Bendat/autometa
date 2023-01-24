import { Component } from '../../meta-types';
import { ClickOn } from '../../meta-types/actions';
/**
 * Represents the `<a>` tag. Exposes its common attributes as asynchronous
 * getters.
 */
export class Anchor extends Component {
  /**
   * Represents the `target=` attribute
   * @returns The value of the target attribute
   */
  target = () => this.getAttribute('target');

  /**
   * Represents the `href=` attribute
   * @returns The value of the target attribute
   */
  get href() {
    return this.getAttribute('href');
  }
  click: ClickOn = this.click;

  get text() {
    return this.read();
  }
}
