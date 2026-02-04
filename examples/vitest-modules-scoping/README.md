# Vitest modules scoping example (hoisted features)

This example demonstrates **hoisted feature scoping** with Autometa when running via the **Vitest plugin**:

- **Tag-based** scoping using `@scope(group:modulePath)` (default)
- **Directory-based** scoping for hoisted features, inferred from the feature path under the configured feature roots

## Layout

- Hoisted features:
  - Tag-based: `src/features/hoisted-tag.feature`
  - Directory-based: `src/features/api/example/hoisted-directory.feature`
- Root steps environment: `src/autometa/root.steps.ts`
- Group steps environment: `src/groups/api/autometa.steps.ts`
- Module step definitions:
  - `src/groups/api/example/steps/example.steps.ts`
  - `src/groups/api/other/steps/example.steps.ts` (intentionally same step text; should not be visible to `api/example`)

## Run

From the repo root:

- Tag-based (no directory inference):
  - `pnpm --filter @autometa/examples-vitest-modules-scoping test:tags`
- Directory-based (infer group/module from `src/features/<group>/<modulePath>/...`):
  - `pnpm --filter @autometa/examples-vitest-modules-scoping test:directory`

