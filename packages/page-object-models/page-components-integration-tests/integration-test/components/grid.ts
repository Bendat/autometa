import { Component, component } from '@autometa/page-components';
import { By } from 'selenium-webdriver';
import { CompoundTypesDiv } from './compound-types';
import { ContainerDiv } from './container-types';
import { FormDiv } from './form-div';
import { SimpleTypeDiv } from './simple-types-div';

export class GridContainer extends Component {
  @component(By.css('div:nth-of-type(1)'))
  simpleTypes: SimpleTypeDiv;

  @component(By.css('div:nth-of-type(2)'))
  compoundTypes: CompoundTypesDiv;

  @component(By.css('div:nth-of-type(3)'))
  containerTypes: ContainerDiv;

  @component(By.css('div:nth-of-type(4)'))
  formTypes: FormDiv;
}
