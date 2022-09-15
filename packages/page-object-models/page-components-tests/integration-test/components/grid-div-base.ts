import { Component, component, Heading1 } from '@automaton/page-components';
import { By } from 'selenium-webdriver';

export abstract class GridDiv extends Component {
  @component(By.css('h1'))
  heading: Heading1;
}
