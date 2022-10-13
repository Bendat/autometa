import { ActionOn, Click } from '@autometa/behaviors';
import {
  Basket,
  HamburgerButton,
  InventoryItem,
  LogoutButton,
} from '../observations/product-page-observers';

export const AddFirstItemToBasket = ActionOn(
  InventoryItem(0),
  ({ addToCart: { click } }) => click()
);

export const AddItemToBasket = (atIndex: number) =>
  ActionOn(InventoryItem(atIndex), ({ addToCart: { click } }) => click());

export const OpenMenu = ActionOn(HamburgerButton, Click);

export const Logout = ActionOn(LogoutButton, Click);

export const OpenBasket = ActionOn(Basket, Click);
