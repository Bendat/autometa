import { CollectionComponent } from "../../src";
import { ProductItem } from "./product-item.component";

export class ProductWrapper extends CollectionComponent<ProductItem> {
  childType = ProductItem;

  async getProduct(name: string) {
    return this.by.selector("li", { hasText: name });
  }
}
