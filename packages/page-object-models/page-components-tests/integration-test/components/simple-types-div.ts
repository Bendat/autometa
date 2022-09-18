import {
  Button,
  collection,
  Collection,
  component,
  ListItem,
  Paragraph,
  UnorderedList,
} from '@autometa/page-components';
import { By } from 'selenium-webdriver';

import { GridDiv } from './grid-div-base';

export class SimpleTypeDiv extends GridDiv {
  @component(By.css('p:nth-of-type(1)'))
  firstParagraph: Paragraph;

  @component(By.css('p:nth-of-type(2)'))
  secondParagraph: Paragraph;

  @component(By.css('ul'))
  unorderedList: UnorderedList;

  @collection(By.css('ol'), ListItem, By.css('li'))
  orderedListAsCollection: Collection<ListItem>;

  @component(By.css('button'))
  button: Button;
}
