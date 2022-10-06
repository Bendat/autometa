import {
  Button,
  Collection,
  collection,
  component,
  WebPage,
} from '@autometa/page-components';
import { By } from 'selenium-webdriver';
import { HamburgerMenu } from '../components/hamburger-menu-component';
import { InventoryItem, ShoppingCart } from '../components/products-components';

export class ProductsPage extends WebPage {
  @component(By.id('react-burger-menu-btn'))
  hamburgerButton: Button;
  @component(By.className('bm-menu'))
  hamburgerMenu: HamburgerMenu;

  @component(By.className('shopping_cart_link'))
  cart: ShoppingCart;

  @collection(
    By.css('#inventory_container .inventory_container .inventory_list'),
    InventoryItem,
    By.css('div')
  )
  inventoryItems: Collection<InventoryItem>;
}
