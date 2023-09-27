import { object, string, literal, z } from "zod";
const uuidRegex =
  /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gm;
export const UUIDStringSchema = string().regex(uuidRegex).optional();

export const StatusSchema = z.union([
  literal("FAILED"),
  literal("BROKEN"),
  literal("PASSED"),
  literal("SKIPPED")
]);
export const EventOptionsSchema = object({
  title: string().optional(),
  keyword: string().optional(),
  tags: string().array().optional(),
  modifier: literal("skip").or(literal("only")).optional(),
  status: StatusSchema.optional()
});

export const ErrorEventSchema = EventOptionsSchema.extend({
  error: z.instanceof(Error).optional()
});
export const ArgsEventSchema = EventOptionsSchema.extend({
  args: z.array(z.unknown()).optional()
});

export const StartFeatureOptsSchema = EventOptionsSchema.extend({
  path: string().optional()
});

export const EndFeatureOptsSchema = ErrorEventSchema;

export const EndRuleOptsSchema = ErrorEventSchema;

export const StartScenarioOutlineOptsSchema = EventOptionsSchema;
// .extend({
//   uuid: UUIDStringSchema.optional()
// });

export const EndScenarioOutlineOptsSchema = ErrorEventSchema;

export const StartScenarioOptsSchema = EventOptionsSchema;

export const EndScenarioOptsSchema = ErrorEventSchema;

export const StartStepOptsSchema = EventOptionsSchema.extend({
  args: z.array(z.unknown()).optional(),
  expression: z.string().optional(),
  text: string().optional()
});
export const EndStepOptsSchema = ErrorEventSchema.extend({
  args: z.array(z.unknown()).optional(),
  expression: z.string(),
  text: string()
});
export const StartBeforeOptsSchema = ArgsEventSchema;
export const EndBeforeOptsSchema = ErrorEventSchema;
export const StartAfterOptsSchema = ArgsEventSchema;
export const EndAfterOptsSchema = ErrorEventSchema;
export const StartSetupOptsSchema = ArgsEventSchema;
export const EndSetupOptsSchema = ErrorEventSchema;
export const StartTeardownOptsSchema = ArgsEventSchema;
export const EndTeardownOptsSchema = ErrorEventSchema;

export type EventOptions = z.infer<typeof EventOptionsSchema>;
export type StartFeatureOpts = z.infer<typeof StartFeatureOptsSchema>;
export type EndFeatureOpts = z.infer<typeof EndFeatureOptsSchema>;
export type StartRuleOpts = EventOptions;
export type EndRuleOpts = z.infer<typeof EndRuleOptsSchema>;
export type StartScenarioOutlineOpts = z.infer<
  typeof StartScenarioOutlineOptsSchema
>;
export type EndScenarioOutlineOpts = z.infer<
  typeof EndScenarioOutlineOptsSchema
>;
export type StartScenarioOpts = z.infer<typeof StartScenarioOptsSchema>;
export type EndScenarioOpts = z.infer<typeof EndScenarioOptsSchema>;
export type StartStepOpts = z.infer<typeof StartStepOptsSchema>;
export type EndStepOpts = z.infer<typeof EndStepOptsSchema>;
export type StartBeforeOpts = z.infer<typeof StartBeforeOptsSchema>;
export type EndBeforeOpts = z.infer<typeof EndBeforeOptsSchema>;
export type StartAfterOpts = z.infer<typeof StartAfterOptsSchema>;
export type EndAfterOpts = z.infer<typeof EndAfterOptsSchema>;
export type StartSetupOpts = z.infer<typeof StartSetupOptsSchema>;
export type EndSetupOpts = z.infer<typeof EndSetupOptsSchema>;
export type StartTeardownOpts = z.infer<typeof StartTeardownOptsSchema>;
export type EndTeardownOpts = z.infer<typeof EndTeardownOptsSchema>;
