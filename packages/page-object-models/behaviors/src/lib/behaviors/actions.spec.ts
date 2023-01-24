import 'reflect-metadata';
import { Component } from '@autometa/page-components';
import { Click, Text, Type } from './actions';

class TestComponent extends Component {
  get text() {
    return 'hello world';
  }
  click = jest.fn();
  type = jest.fn();
}
describe('Default Action Behaviors', () => {
  let component: TestComponent;
  beforeEach(() => {
    component = new TestComponent();
  });
  it('should click on a component', () => {
    Click(component);
    expect(component.click).toHaveBeenCalled();
  });
  it('should read from a component ', () => {
    const text = Text(component);
    expect(text).toEqual('hello world');
  });
  it('should write text to a component', () => {
    Type('hello world').call(undefined, component);
    expect(component.type).toHaveBeenCalled();
  });
});
