import { Fixture, HTTP } from "@autometa/runner";
import { Product, ProductList } from "./product.types";
import { ProductListSchema, ProductSchema } from "./product.schema";
import { BaseController } from "../base.controller";

@Fixture
export class ProductController extends BaseController {
  constructor(http: HTTP) {
    super(http);
  }

  all() {
    return this.http
      .route("products")
      .schema(ProductListSchema, 201, 200)
      .get<ProductList>();
  }

  view(id: number) {
    return this.http
      .route("products")
      .route(id)
      .schema(ProductSchema, 201, 200)
      .get<Product>();
  }

  search(query: string) {
    return this.http
      .route("products")
      .schema(ProductListSchema, 201, 200)
      .param("q", query)
      .get<ProductList>();
  }

  update(id: string, data: Partial<Product>) {
    return this.http
      .route("products")
      .route(id)
      .data(data)
      .schema(ProductSchema, 201, 200)
      .put<Product>();
  }

  add(data: Product) {
    return this.http
      .route("products")
      .data(data)
      .schema(ProductSchema, 201)
      .post<Product>();
  }
}
