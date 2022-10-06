import { ActionOn } from '@autometa/behaviors';
import { HamburgerButton, HamburgerMenu, InventoryItem } from '../observations/product-page-observers';

export const AddFirstItemToBasket = ActionOn(
  InventoryItem(0),
  ({ addToCart: { click } }) => click()
);

export const OpenMenu = ActionOn(HamburgerButton, ({click})=>click())

export const Logout = ActionOn(InventoryItem(0), ({ addToCart: { click } }) =>
  click()
);
