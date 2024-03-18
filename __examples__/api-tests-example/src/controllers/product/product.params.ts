import {
  camel,
  convertPhrase,
  defineParameterType,
  AssertKey,
} from "@autometa/runner";
import { ProductBuilder } from "./product.builder";
import { ProductIdMap } from "./product.static";
defineParameterType(
  {
    name: "builder:product",
    regexpPattern: [/'([^']*)'/, /"([^"]*)"/],
    transform: (value) => new ProductBuilder().title(value),
  },
  {
    name: "product:property",
    regexpPattern: [/'([^']*)'/, /"([^"]*)"/, /[^\s]+/],
    transform: (value) => convertPhrase(value, camel),
  },
  {
    name: "product:static:name",
    regexpPattern: [/'([^']*)'/, /"([^"]*)"/],
    transform: (value) => {
      AssertKey(ProductIdMap, value, `Product property key '${value}'`);
      return ProductIdMap[value];
    },
  }
);
