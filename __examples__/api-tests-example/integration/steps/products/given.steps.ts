import { Given } from "@autometa/runner";

Given(
  "I want to view the product {product:static:name}",
  (productId, { world }) => {
    world.viewProductId = productId
  }
);
