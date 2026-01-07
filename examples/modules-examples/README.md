# Modules discovery example (multi-group)

This example exists to exercise Autometa's **modules** feature:

- multiple module **groups** (friendly ids, each with a filesystem root)
- module-relative discovery for `features` and `steps`
- CLI filtering via:
  - `-g/--group <group>` (repeatable)
  - `-m/--module <module>` (repeatable; optionally scoped as `group/module` or `group:module`)

It also demonstrates how you can run **hoisted** features with either:

- only hoisted steps (via `--environment hoisted`)
- only grouped steps (via `-g/-m` filters)

## Step scoping (important)

This example enables **scoped step visibility** via:

- `modules.stepScoping: "scoped"`

With step scoping enabled:

- hoisted features can only use **root** steps by default
- module-relative features can use **root + group + ancestral module** steps
- sibling module steps are **not** visible (e.g. `menu` cannot see `reports`)

### Escape hatch for hoisted features

If you intentionally want a hoisted feature file to behave as-if it belongs to a module, add a tag:

- `@scope(backoffice:reports)`

## Layout

- Root step environment: `src/autometa/root.steps.ts`
- Group step environments:
  - `src/groups/brew-buddy/autometa.steps.ts`
  - `src/groups/backoffice/autometa.steps.ts`

Common steps are registered via an installer:

- `src/autometa/common.steps.ts` (installed into each environment)
- Group roots:
  - `src/groups/brew-buddy/*`
  - `src/groups/backoffice/*`

Each module directory contains:

- `.features/**/*.feature`
- `steps/**/*.steps.ts`

This example also includes a nested "submodule" under Backoffice:

- `backoffice/orders/cancellations`

## Try it

From the repo root:

- Run Brew Buddy group:
  - `pnpm --filter @autometa/module-examples test` (runs both groups)
  - or `pnpm --filter @autometa/module-examples --silent exec autometa run --standalone -g brew-buddy`

- Run Backoffice group:
  - `pnpm --filter @autometa/module-examples --silent exec autometa run --standalone -g backoffice`

### Hoisted vs grouped demo

Hoisted feature with **hoisted-only** steps (uses `autometa.config.ts` environment `hoisted`):

- `pnpm --filter @autometa/module-examples --silent exec autometa run --standalone --environment hoisted src/features/hoisted-only.feature`

Hoisted feature with **grouped-only** steps (default environment + module filters):

- `pnpm --filter @autometa/module-examples --silent exec autometa run --standalone -g backoffice -m reports src/features/hoisted-with-grouped-steps.feature`

### Ambiguity demo

Because both groups have an `orders` module, `-m orders` is ambiguous unless you scope it:

- `autometa run --standalone -g brew-buddy -m orders`
- `autometa run --standalone -m brew-buddy/orders`
- `autometa run --standalone -m backoffice:orders`

### Submodule demo

Because "modules" can be nested by declaring a module path, you can select a submodule using `:` as a path separator:

- `autometa run --standalone -g backoffice -m orders:cancellations`
- `autometa run --standalone -m backoffice:orders:cancellations`
