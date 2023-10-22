import { Product } from "./product.types";
import { Property } from "@autometa/dto-builder";
export class ProductDTO implements Product {
  @Property
  id: number;
  @Property
  title: string;
  @Property
  description: string;
  @Property
  price: number;
  @Property
  discountPercentage: number;
  @Property
  rating: number;
  @Property
  stock: number;
  @Property
  brand: string;
  @Property
  category: string;
  @Property
  thumbnail: string;
  @Property
  images: string[];
}
