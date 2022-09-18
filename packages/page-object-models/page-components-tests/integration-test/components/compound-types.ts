import { component, Select } from '@autometa/page-components';
import { By } from 'selenium-webdriver';
import { GridDiv } from './grid-div-base';

export class CompoundTypesDiv extends GridDiv {
  @component(By.css('select'))
  dropdown: Select;
}
