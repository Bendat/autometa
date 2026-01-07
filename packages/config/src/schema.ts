import { z } from "zod";

import type { BuildHook, BuilderConfig, BuilderHooks, ModuleFormat, SourceMapSetting } from "./builder-types";

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

export const RunnerSchema = z.union([z.literal("jest"), z.literal("vitest"), z.literal("playwright")]);

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

export const LoggingSchema = z
  .object({
    http: z.boolean().optional(),
  })
  .optional();

export const ReporterSchema = z
  .object({
    hierarchical: z
      .object({
        bufferOutput: z.boolean().optional(),
      })
      .optional(),
  })
  .optional();

export const ModuleFormatSchema: z.ZodType<ModuleFormat> = z.enum(["cjs", "esm"]);

export const PartialRootSchema = RootSchema.partial();

export const ModulesConfigSchema = z.object({
  relativeRoots: PartialRootSchema,
  groups: z.record(z.array(z.string()).nonempty()).optional(),
  explicit: z.array(z.string()).optional(),
});

const SourceMapSchema: z.ZodType<SourceMapSetting> = z.union([
  z.literal(true),
  z.literal(false),
  z.literal("inline"),
  z.literal("external"),
]);

const BuildHookSchema: z.ZodType<BuildHook> = z.custom<BuildHook>((value) => {
  return typeof value === "function";
}, {
  message: "build hooks must be functions",
});

const BuilderHooksSchema: z.ZodType<BuilderHooks> = z.object({
  before: z.array(BuildHookSchema).optional(),
  after: z.array(BuildHookSchema).optional(),
});

export const BuilderConfigSchema: z.ZodType<BuilderConfig> = z
  .object({
    format: ModuleFormatSchema.optional(),
    target: z.union([z.string(), z.array(z.string()).nonempty()]).optional(),
    sourcemap: SourceMapSchema.optional(),
    tsconfig: z.string().optional(),
    external: z.array(z.string()).optional(),
    outDir: z.string().optional(),
    hooks: BuilderHooksSchema.optional(),
  });

export const ExecutorConfigSchema = z.object({
  runner: RunnerSchema,
  test: TestSchema.optional(),
  roots: RootSchema,
  modules: ModulesConfigSchema.optional(),
  shim: ShimSchema.optional(),
  events: EventsSchema.optional(),
  builder: BuilderConfigSchema.optional(),
  logging: LoggingSchema.optional(),
  reporting: ReporterSchema.optional(),
});

export const PartialExecutorConfigSchema = z.object({
  runner: RunnerSchema.optional(),
  test: TestSchema.optional(),
  roots: PartialRootSchema.optional(),
  modules: ModulesConfigSchema.optional(),
  shim: ShimSchema.optional(),
  events: EventsSchema.optional(),
  builder: BuilderConfigSchema.optional(),
  logging: LoggingSchema.optional(),
  reporting: ReporterSchema.optional(),
});
