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
    regex: [/'([^']*)'/, /"([^"]*)"/],
    transform: (value) => new ProductBuilder().title(value),
  },
  {
    name: "product:property",
    regex: [/'([^']*)'/, /"([^"]*)"/, /[^\s]+/],
    transform: (value) => convertPhrase(value, camel),
  },
  {
    name: "product:static:name",
    regex: [/'([^']*)'/, /"([^"]*)"/],
    transform: (value) => {
      AssertKey(ProductIdMap, value, `Product property key '${value}'`);
      return ProductIdMap[value];
    },
  }
);
