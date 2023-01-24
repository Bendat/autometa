import { Anchor, component, Component, Span } from '@autometa/page-components';
import { By } from 'selenium-webdriver';

export class CartItem extends Component {
  @component(By.className('cart_quantity'))
  quantityLabel: Span;

  @component(By.css('div:nth-of-type(2) a div'))
  itemLabel: Anchor;

  @component(By.className('inventory_item_desc'))
  descriptionText: Span;

  @component(By.className('inventory_item_price'))
  priceLabel: Span;

  @component(By.css('.item_pricebar button'))
  removeButton: Span;
}
