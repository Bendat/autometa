import { Component } from '../../meta-types/component';

export class Time extends Component {
  get dateTime() {
    return this.getAttribute('datetime');
  }
  get text() {
    return super.read();
  }
}
