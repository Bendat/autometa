import { Observe } from '@autometa/behaviors';
import { ProductsPage } from '../../page-objects/pages/products-page';

export const HamburgerButton = Observe(
  ProductsPage,
  ({ hamburgerButton }) => hamburgerButton
);

export const HamburgerMenu = Observe(
  ProductsPage,
  ({ hamburgerMenu }) => hamburgerMenu
);

export const LogoutButton = Observe(HamburgerMenu, ({ logout }) => logout);

export const InventoryItems = Observe(
  ProductsPage,
  ({ inventoryItems }) => inventoryItems
);

export const Basket = Observe(ProductsPage, ({ cart }) => cart);
export const BasketBadgeCount = Observe(Basket, ({ badge: { text } }) => text);
export const InventoryItem = (index: number) =>
  Observe(InventoryItems, ({ at }) => at(index));
