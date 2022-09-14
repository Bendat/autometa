import { Component } from '../../meta-types/component';

export class Image extends Component {
  get src() {
    return this.getAttribute('src');
  }
  get alt() {
    return this.getAttribute('alt');
  }
  click = super.click;
}
