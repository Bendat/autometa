import {
  Anchor,
  Button,
  Component,
  component,
  Option,
  Paragraph,
  Select,
  Span,
} from '@autometa/page-components';
import { By } from 'selenium-webdriver';

export class OrderBy extends Select {
  @component(By.css('option:nth-of-type(1)'))
  nameAZ: Option;

  @component(By.css('option:nth-of-type(2)'))
  nameZA: Option;

  @component(By.css('option:nth-of-type(3)'))
  priceLowHigh: Option;

  @component(By.css('option:nth-of-type(4)'))
  priceHighLow: Option;
}

export class ShoppingCart extends Anchor {
  @component(By.className('shopping_cart_badge'))
  badge: Span;
}

export class ItemLabel extends Anchor {
  @component(By.css('a'))
  itemLink: Anchor;

  @component(By.css('div'))
  itemNameText: Paragraph;

  get text() {
    return this.itemNameText.text;
  }

  click = () => this.itemLink.click();
}

export class InventoryItem extends Component {
  @component(By.className('inventory_item_label a'))
  label: Paragraph;
  @component(By.className('inventory_item_desc'))
  description: Paragraph;

  @component(By.className('btn_inventory'))
  addToCart: Button;
}
