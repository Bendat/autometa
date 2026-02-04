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

type ModuleDeclaration =
  | string
  | { readonly name: string; readonly submodules?: ModuleDeclaration[] | undefined };

const ModuleDeclarationSchema: z.ZodType<ModuleDeclaration> = z.lazy(() =>
  z.union([
    z.string(),
    z.object({
      name: z.string().min(1),
      submodules: z.array(ModuleDeclarationSchema).optional(),
    }),
  ])
);

export const ModulesConfigSchema = z.object({
  stepScoping: z.enum(["global", "scoped"]).optional(),
  relativeRoots: PartialRootSchema.optional(),
  groups: z
    .record(
      z.object({
        root: z.string(),
        modules: z.array(ModuleDeclarationSchema).nonempty(),
      })
    )
    .optional(),
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
  roots: RootSchema.optional(),
  modules: ModulesConfigSchema.optional(),
  shim: ShimSchema.optional(),
  events: EventsSchema.optional(),
  builder: BuilderConfigSchema.optional(),
  logging: LoggingSchema.optional(),
  reporting: ReporterSchema.optional(),
}).superRefine((value, ctx) => {
  if (value.roots) {
    return;
  }

  const modules = value.modules;
  if (!modules) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["roots"],
      message: '"roots" is required unless "modules.relativeRoots" defines at least "features" and "steps".',
    });
    return;
  }

  const declaredModules =
    (modules.explicit?.some((entry) => entry.trim().length > 0) ?? false) ||
    (modules.groups ? Object.keys(modules.groups).length > 0 : false);

  if (!declaredModules) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["modules"],
      message:
        'When omitting "roots", at least one module must be declared via "modules.groups" or "modules.explicit".',
    });
  }

  const relativeRoots = modules.relativeRoots;
  const hasFeatures =
    !!relativeRoots && Array.isArray(relativeRoots.features) && relativeRoots.features.length > 0;
  const hasSteps =
    !!relativeRoots && Array.isArray(relativeRoots.steps) && relativeRoots.steps.length > 0;

  if (!hasFeatures || !hasSteps) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["modules", "relativeRoots"],
      message:
        'When omitting "roots", "modules.relativeRoots" must include non-empty "features" and "steps" entries.',
    });
  }
}).transform((value) => {
  return {
    ...value,
    roots: value.roots ?? {
      features: [],
      steps: [],
    },
  };
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
