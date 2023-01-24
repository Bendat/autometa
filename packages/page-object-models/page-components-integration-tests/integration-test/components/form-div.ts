import {
  Checkbox,
  Component,
  component,
  TextArea,
  TextInput,
} from '@autometa/page-components';
import { By } from 'selenium-webdriver';
import { GridDiv } from './grid-div-base';

export class CheckBoxFieldSet extends Component {
  @component(By.css('input[type="checkbox"]:first-of-type'))
  hasFoos: Checkbox;

  @component(By.css('input[type="checkbox"]:last-of-type'))
  hasBars: Checkbox;
}

export class RadioFieldSet extends Component {
  @component(By.css('input[type="radio"]:first-of-type'))
  hasBazs: Checkbox;

  @component(By.css('input[type="radio"]:last-of-type'))
  HasBuzzes: Checkbox;
}

export class FormDiv extends GridDiv {
  @component(By.css('input'))
  textInput: TextInput;

  @component(By.css('textarea'))
  textArea: TextArea;

  @component(By.css('fieldset:first-of-type'))
  checkFieldSet: CheckBoxFieldSet;

  @component(By.css('fieldset:last-of-type'))
  radioFieldSet: RadioFieldSet;
}
