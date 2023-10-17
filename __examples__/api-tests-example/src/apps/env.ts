import { cleanEnv, str } from "envalid";
import dotenv from "dotenv";
dotenv.config();
export const Env = cleanEnv(process.env, {
  API_URL: str({ example: "https://example.com" })
});
