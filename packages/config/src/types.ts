import { z } from "zod";
import { TestExecutorConfigSchema } from "./config.schema";

export type TestExecutorConfig = z.infer<typeof TestExecutorConfigSchema>;
