import {
  Button,
  Component,
  component,
  Heading3,
  TextInput,
} from '@autometa/page-components';
import { By } from 'selenium-webdriver';

export class LoginBox extends Component {
  @component(By.id('user-name'))
  username: TextInput;
  @component(By.id('password'))
  password: TextInput;
  @component(By.id('login-button'))
  login: Button;
  @component(By.css('[data-test="error"]'))
  errorMessage: Heading3;
}
