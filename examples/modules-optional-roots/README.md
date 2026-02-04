# Modules without `roots`

This example proves that `autometa.config.ts` can omit `roots` as long as:

- `modules.relativeRoots.features` is set (so features can be discovered per-module), and
- `modules.relativeRoots.steps` is set (so the step environment + step files can be loaded).

## Try it

```sh
corepack pnpm install
corepack pnpm --filter @autometa/examples-modules-optional-roots test
```

Or run a single module:

```sh
corepack pnpm --filter @autometa/examples-modules-optional-roots exec \
  env AUTOMETA_CACHE_DIR=.autometa-cache \
  autometa run --standalone -g backoffice -m reports
```

## Notes

- The shared group steps environment lives at `src/groups/backoffice/autometa.steps.ts`.
- `modules.relativeRoots.steps` uses `../autometa.steps.ts` so each module pulls in the shared group environment without needing hoisted `roots.steps`.
