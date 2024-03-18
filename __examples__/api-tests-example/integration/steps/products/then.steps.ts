import { AssertKey, Then, VTable } from "@autometa/runner";

Then(
  "the product {product:property} is {primitive}",
  (target, value, { world }) => {
    const { data: product } = world.viewProductResponse;
    expect(product[target]).toEqual(value);
  }
);
Then(
  "the product has the expected details",
  (table, { world }) => {
    const {
      data: { description, price, discountPercentage, brand },
    } = world.viewProductResponse;
    const expectedDescription = table.get<string>("description", 0);
    const expectedPrice = table.get<number>("price", 0);
    const expectedDiscount = table.get<number>("discount", 0);
    const expectedBrand = table.get<string>("brand", 0);

    expect(description).toEqual(expectedDescription);
    expect(price).toEqual(expectedPrice);
    expect(discountPercentage).toEqual(expectedDiscount);
    expect(brand).toEqual(expectedBrand);
  },
  VTable
);

Then(
  "the {ordinal} product {product:property} is {primitive}",
  (index, target, value, { world }) => {
    const response = world.viewAllProductsResponse;
    const product = response.data.products[index - 1];
    expect(product[target]).toEqual(value);
    world.viewProductResponse = response.decompose(product);
  }
);

Then(
  "the products list {product:property} is {int}",
  (property, count, { world }) => {
    const response = world.viewAllProductsResponse;
    const products = response.data;
    AssertKey(products, property, `Product property key '${property}'`);
    expect(products[property]).toEqual(count);
  }
);
