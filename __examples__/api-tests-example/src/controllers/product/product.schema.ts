import { string, number, object, array } from "myzod";

export const ProductSchema = object(
  {
    id: number(),
    title: string(),
    description: string(),
    price: number(),
    discountPercentage: number(),
    rating: number(),
    stock: number(),
    brand: string().optional(),
    category: string(),
    thumbnail: string(),
    images: array(string()),
  },
  { allowUnknown: true }
);

export const ProductListSchema = object({
  products: array(ProductSchema),
  total: number(),
  skip: number(),
  limit: number(),
});

export const CategoriesSchema = array(string());
