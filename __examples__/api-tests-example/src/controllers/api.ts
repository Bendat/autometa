import { Constructor, Fixture } from "@autometa/runner";
import { ProductController } from "./product";

@Fixture
@Constructor(ProductController)
export class API {
  constructor(readonly products: ProductController) {}
}
