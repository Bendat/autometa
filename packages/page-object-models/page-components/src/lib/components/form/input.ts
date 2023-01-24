import { ClickOn, Submit } from '../../meta-types/actions';
import { Component } from '../../meta-types/component';

/**
 * Simple default implementation for the `<input>` tag.
 * Exposes actions and attributes commonly used with Input.
 *
 * Further functionality are exposed by components which extend
 * from Input, such as { @see TextInput } or { @see RadioButton }
 */
export class Input extends Component {
  get text() {
    return super.read();
  }

  get name() {
    return this.getAttribute('name');
  }

  get for() {
    return this.getAttribute('for');
  }

  get value() {
    return this.getAttribute('value');
  }

  get inputType() {
    return this.getAttribute('type');
  }

  click: ClickOn = this.click;

  submit: Submit = this.submit;
}
