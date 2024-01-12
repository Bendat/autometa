import { Class } from "@autometa/types";
import { defaultClient, type HTTPClient } from "./http-client";

export function defaultClientFactory() {
  const type = defaultClient as Class<HTTPClient>;
  return new type();
}
