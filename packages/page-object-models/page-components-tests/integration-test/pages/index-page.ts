import { WebPage, component } from '@automaton/page-components';
import { By } from 'selenium-webdriver';
import { GridContainer } from '../components/grid';

export class IndexPage extends WebPage {
  // override readonly route = '/'
  @component(By.className('grid'))
  grid: GridContainer;
}
