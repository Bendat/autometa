import { Infer } from "myzod";
import {
  CategoriesSchema,
  ProductListSchema,
  ProductSchema
} from "./product.schema";
import { HTTPResponse } from "@autometa/runner";

export type Product = Infer<typeof ProductSchema>;
export type ProductResponse = HTTPResponse<Product>;
export type ProductList = Infer<typeof ProductListSchema>;
export type ProductListResponse = HTTPResponse<ProductList>;
export type Categories = Infer<typeof CategoriesSchema>;
export type CategoriesResponse = HTTPResponse<Categories>;
