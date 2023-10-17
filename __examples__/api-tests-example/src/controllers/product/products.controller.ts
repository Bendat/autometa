import { Fixture, HTTP } from "@autometa/runner";
import { Env } from "../../apps";

@Fixture
export class ProductController {
  constructor(private readonly http: HTTP) {
    this.http.url(Env.API_URL);
  }

  all() {
    return this.http.route("products").get();
  }

  get(id: string) {
    return this.http.route("products", id).get();
  }

  search(query: string) {
    return this.http.route("products").param("q", query).get();
  }

  update(id: string, data: any) {
    return this.http.route("products", id).data(data).put();
  }
}
