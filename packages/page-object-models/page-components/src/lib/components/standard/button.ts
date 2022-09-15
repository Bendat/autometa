import { InjectableComponent } from '../../decorators/injectables';
import { Click } from '../../meta-types/actions';
import { Component } from '../../meta-types/component';

/**
 * A default implementation for a standard button element.
 * Exposes the `click` and `getText` (as `text`) actions
 * in the underlying web element.
 */
@InjectableComponent()
export class Button extends Component {
  click: Click = this.click;

  get text() {
    return this.read();
  }
}
