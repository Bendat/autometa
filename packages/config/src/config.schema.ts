import { object, string, literal, number, boolean } from "zod";

export const RunnerSchema = literal("jest").or(literal("vitest"));
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

export const ShimSchema = object({
  errorCause: boolean().optional()
}).optional();

export const EventsSchema = string().array();

export const PathSchema = string().array();
export const RootSchema = object({
  features: PathSchema,
  steps: PathSchema,
  app: PathSchema,
  parameterTypes: PathSchema.optional()
});

export const TestExecutorConfigSchema = object({
  runner: RunnerSchema,
  environment: EnvironmentSchema,
  test: TestSchema,
  roots: RootSchema,
  shim: ShimSchema.optional(),
  events: EventsSchema.optional()
});
