import type { ProductBuilder, Product, ProductId } from "../controllers";
import { World } from "./default.world";

export interface Types {
  "builder:product": ProductBuilder;
  "product:property": keyof Product;
  "product:static:name": ProductId;
  "world:property:response": keyof World;
  ordinal: number;
}
