import { Fixture } from "@autometa/runner";
import { ProductController } from "./product";

@Fixture
export class API {
  constructor(readonly products: ProductController) {}
}
