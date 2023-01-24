import { WebPage, component, Button } from '@autometa/page-components';
import { By } from 'selenium-webdriver';
import { HamburgerMenu } from '../components/hamburger-menu-component';

export abstract class StandardPage extends WebPage {
  @component(By.id('react-burger-menu-btn'))
  hamburgerButton: Button;
  @component(By.className('bm-menu'))
  hamburgerMenu: HamburgerMenu;
}
