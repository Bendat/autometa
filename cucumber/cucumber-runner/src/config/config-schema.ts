import j from "joi";

export const ConfigSchema = j.object({
  app: j.function().optional(),
  tagFilter: j.string().optional(),
  featuresRoot: j.string().optional(),
  globalsRoot: j.string().optional(),
  subscribers: j.array().items(j.function()),
  dataTables: j
    .object({
      default: j.function().optional(),
    })
    .optional(),
  runner: j
    .object({
      name: j.string(),
      test: j.function(),
      describe: j.function(),
      beforeAll: j.function(),
      beforeEach: j.function(),
      afterEach: j.function(),
      afterAll: j.function(),
    })
    .optional(),
});
