import { InjectableComponent } from '../../decorators/injectables';
import { Component } from '../../meta-types/component';
import { Until } from '../../until/until';

@InjectableComponent()
export class Progress extends Component {
  protected override _defaultUntil = Until.isVisible;
  get value() {
    return this.getAttribute('value');
  }
  get max() {
    return this.getAttribute('max');
  }
}
