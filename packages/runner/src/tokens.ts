import { createToken } from "@autometa/injection";

export const WORLD_TOKEN = createToken<Record<string, unknown>>(
"@autometa/runner/world"
);
