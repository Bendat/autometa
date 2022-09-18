import {
  component,
  Heading3,
  Paragraph,
  Anchor,
  Component,
} from '@autometa/page-components';
import { By } from 'selenium-webdriver';
import { GridDiv } from './grid-div-base';

export class ContainerArticleHeader extends Component {
  @component(By.css('h3'))
  heading: Heading3;

  @component(By.css('p'))
  paragraph: Paragraph;
}

export class ContainerArticle extends Component {
  @component(By.css('header'))
  header: ContainerArticleHeader;

  @component(By.css('header+p'))
  paragraph: Paragraph;

  @component(By.css('a'))
  link: Anchor;
}

export class ContainerDiv extends GridDiv {
  @component(By.css('article'))
  article: ContainerArticle;
}
