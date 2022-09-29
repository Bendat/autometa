import {
  Collection,
  collection,
  component,
  WebPage,
} from '@autometa/page-components';
import { By } from 'selenium-webdriver';
import { InventoryItem, ShoppingCart } from '../components/products-components';

export class ProductsPage extends WebPage {
  @component(By.className('shopping_cart_link'))
  cart: ShoppingCart;

  @collection(By.className('inventory_container'), InventoryItem, By.className('inventory-item'))
  inventoryItems: Collection<InventoryItem>;
}
