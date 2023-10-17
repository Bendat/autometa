import { Infer } from "myzod";
import { CategorySchema, ProductListSchema, ProductSchema } from "./product.schema";

export type ProductBody = Infer<typeof ProductSchema>;
export type ProductListBody = Infer<typeof ProductListSchema>;
export type CategoryBody = Infer<typeof CategorySchema>;
