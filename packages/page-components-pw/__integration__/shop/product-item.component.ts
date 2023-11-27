import {
  Anchor,
  Text,
  BySelector,
  Component,
  CollectionComponent,
  Behavior,
  Clickable,
  Button,
  Hoverable
} from "../../src";
import { ProductColor, ProductSize } from "./product.item.enum";
export class ColorChoice extends Behavior(Clickable) {}
export class ProductColorChooser extends CollectionComponent<ColorChoice> {
  childType = ColorChoice;

  select(color: ProductColor) {
    return this.by.selector(`[option-label="${color}"]`).click();
  }
}

export class ProductSizeChooser extends CollectionComponent<Button> {
  childType = Button;

  select(size: ProductSize) {
    return this.by.selector(`[option-label="${size}"]`).click();
  }
}
export class ProductItem extends Behavior(Hoverable) {
  @BySelector(Anchor, ".product.photo.product-item-photo")
  productImage: Anchor;

  @BySelector(Text, ".price")
  priceLabel: Text;

  @BySelector(Anchor, ".product-item-link")
  productLink: Anchor;

  @BySelector(ProductSizeChooser, ".swatch-attribute.size")
  sizeChooser: ProductSizeChooser;

  @BySelector(ProductColorChooser, ".swatch-attribute.color")
  colorChooser: ProductColorChooser;

  @BySelector(Button, ".tocart")
  addToCartButton: Button;

  get price() {
    return this.priceLabel.textContent().then((text) => text?.slice(1));
  }

  async configure(name: string, size?: ProductSize, color?: ProductColor) {
    await this.hover();
    size && (await this.sizeChooser.select(size));
    color && (await this.colorChooser.select(color));
  }

  async addToCart() {
    await this.hover();
    await this.addToCartButton.click();
  }
}
