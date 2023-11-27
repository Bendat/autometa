import { Behavior, BySelector } from "../../src";
import { PromotionWidget } from "./promotion.widget.component";

export class Promotions extends Behavior() {
  @BySelector(PromotionWidget, ".block-promo.home-main")
  highlighted: PromotionWidget;

  getByCategory(category: "Pants" | "Performance") {
    const text = `Shop ${category}`;
    const categoryLocator = this.locator.getByText(text);
    return this.build(PromotionWidget, (driver) =>
      driver.locator("a", { has: categoryLocator })
    );
  }
}
