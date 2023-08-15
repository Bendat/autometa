import { object, string, literal, number, boolean, array } from "zod";

export const RunnerSchema = literal("jest"); //.or(literal("vitest"));
export const EnvironmentSchema = string().optional();
export const TimeoutSchema = number().optional();
export const TagFilterSchema = string()
  .refine(
    (it) => it.startsWith("@") || it.startsWith("not @"),
    "tag filter must start with `@` or `not @`"
  )
  .optional();

export const TestSchema = object({
  timeout: TimeoutSchema,
  tagFilter: TagFilterSchema
}).optional();

export const ExperimentalSchema = object({
  errorCauseShim: boolean().optional()
}).optional();

// Use decorators
// export const AppSchema = z.instanceof(AutometaApp);
// export const WorldSchema = z.instanceof(AutometaWorld);
// export const CucumberSchema = object({ app: AppSchema, world: WorldSchema });
export const RootSchema = object({
  features: string().or(array(string())),
  steps: string().or(array(string()))
});
export const TestExecutorConfigSchema = object({
  runner: RunnerSchema,
  environment: EnvironmentSchema,
  test: TestSchema,
  experimental: ExperimentalSchema
});
