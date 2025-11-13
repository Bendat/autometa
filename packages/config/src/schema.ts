import { z } from "zod";

export const TimeUnitSchema = z.enum(["ms", "s", "m", "h"]);

export const TimeoutSchema = z
  .union([
    z.number().nonnegative(),
    z.tuple([z.number().nonnegative(), TimeUnitSchema]),
    z.object({
      value: z.number().nonnegative(),
      unit: TimeUnitSchema.optional(),
    }),
  ])
  .optional();

export const RunnerSchema = z.union([z.literal("jest"), z.literal("vitest")]);

export const TagFilterSchema = z
  .string()
  .refine(
    (value) => value.startsWith("@") || value.startsWith("not @"),
    "tag filter must start with `@` or `not @`"
  )
  .optional();

export const TestSchema = z
  .object({
    timeout: TimeoutSchema,
    tagFilter: TagFilterSchema,
    groupLogging: z.boolean().optional(),
  })
  .partial();

export const ShimSchema = z.object({
  errorCause: z.boolean().optional(),
});

export const PathSchema = z.array(z.string());

export const RootSchema = z
  .object({
    features: PathSchema,
    steps: PathSchema,
    support: PathSchema.optional(),
  })
  .catchall(PathSchema);

export const EventsSchema = z.array(z.string());

export const ExecutorConfigSchema = z.object({
  runner: RunnerSchema,
  test: TestSchema.optional(),
  roots: RootSchema,
  shim: ShimSchema.optional(),
  events: EventsSchema.optional(),
});

export const PartialRootSchema = RootSchema.partial();

export const PartialExecutorConfigSchema = z.object({
  runner: RunnerSchema.optional(),
  test: TestSchema.optional(),
  roots: PartialRootSchema.optional(),
  shim: ShimSchema.optional(),
  events: EventsSchema.optional(),
});
