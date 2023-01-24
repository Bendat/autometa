import { Button, Component, component } from '@autometa/page-components';
import { By } from 'selenium-webdriver';

export class HamburgerMenu extends Component {
  @component(By.id('logout_sidebar_link'))
  logout: Button;
}
