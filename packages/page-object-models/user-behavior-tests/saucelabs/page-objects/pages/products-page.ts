import { Collection, collection, component } from '@autometa/page-components';
import { By } from 'selenium-webdriver';
import { InventoryItem, ShoppingCart } from '../components/products-components';
import { StandardPage } from './standard-page';

export class ProductsPage extends StandardPage {
  @component(By.className('shopping_cart_link'))
  cart: ShoppingCart;

  @collection(
    By.css('#inventory_container .inventory_container .inventory_list'),
    InventoryItem,
    By.css('div')
  )
  inventoryItems: Collection<InventoryItem>;
}
