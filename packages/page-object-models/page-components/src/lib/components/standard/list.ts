import { By } from 'selenium-webdriver';
import { Collection } from '../groups/collection';
import { TextComponent } from './text';

/**
 * Represents the `<ol>` tag
 */
export class OrderedList extends Collection<ListItem> {
  protected childType = ListItem;
  protected childElementLocator: By = By.css('li');
}
/**
 * Represents the `<ul>` tag
 */
export class UnorderedList extends Collection<ListItem> {
  protected childType = ListItem;
  protected childElementLocator: By = By.css('li');
}
/**
 * Represents the `<li>` tag
 */
export class ListItem extends TextComponent {}
