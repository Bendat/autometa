import { component, WebPage } from '@autometa/page-components';
import { By } from 'selenium-webdriver';
import { LoginBox } from '../components/homepage-components';

export class SauceDemoPage extends WebPage {
  @component(By.className('login-box'))
  loginBox: LoginBox;
}
