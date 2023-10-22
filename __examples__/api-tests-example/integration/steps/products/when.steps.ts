import { When } from "@autometa/runner";

When("I view the product", async ({ world, api: { products } }) => {
  world.viewProductResponse = await products.view(world.viewProductId);
});

When("I view all products", async ({ world, api: { products } }) => {
  world.viewAllProductsResponse = await products.all();
});
