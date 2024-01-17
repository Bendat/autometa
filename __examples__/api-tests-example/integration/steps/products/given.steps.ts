import { App, Given } from "@autometa/runner";

Given(
  "I want to view the product {product:static:name}",
  (productId, { world }: App) => {
    world.viewProductId = productId;
  }
);
