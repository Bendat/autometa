import { BySelector } from "../../src";
import { BasePage } from "./base.page";
import { StoreMenu } from "./navigation-bar.component";
import { ProductColor, ProductSize } from "./product.item.enum";
import { ProductWrapper } from "./product.wrapper.component";

export class ProductExplorationPage extends BasePage {
  route = "";
  @BySelector(StoreMenu, "#store.menu ul")
  menu: StoreMenu;

  @BySelector(ProductWrapper, "products.list.items.product-items")
  products: ProductWrapper;

  async addProductToCart(
    name: string,
    color?: ProductColor,
    size?: ProductSize
  ) {
    const product = await this.products.getProduct(name);
    await product.configure(name, size, color);
    await product.addToCart();
    return product.price;
  }
}
