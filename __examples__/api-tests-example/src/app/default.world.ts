import { AutometaWorld, Fixture } from "@autometa/runner";
import type {
  ProductId,
  ProductListResponse,
  ProductResponse
} from "../controllers/product";

@Fixture
export class World extends AutometaWorld {
  declare viewProductId: ProductId;
  declare viewProductResponse: ProductResponse;
  declare viewAllProductsResponse: ProductListResponse;
}
