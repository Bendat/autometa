# Modules discovery example (multi-group)

This example exists to exercise Autometa's **modules** feature:

- multiple module **groups** (friendly ids, each with a filesystem root)
- module-relative discovery for `features` and `steps`
- CLI filtering via:
  - `-g/--group <group...>`
  - `-m/--module <module...>` (optionally scoped as `group/module` or `group:module`)

## Layout

- Shared step environment: `src/autometa/steps.ts`
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

### Ambiguity demo

Because both groups have an `orders` module, `-m orders` is ambiguous unless you scope it:

- `autometa run --standalone -g brew-buddy -m orders`
- `autometa run --standalone -m brew-buddy/orders`
- `autometa run --standalone -m backoffice:orders`

### Submodule demo

Because "modules" can be nested by declaring a module path, you can select a submodule using `:` as a path separator:

- `autometa run --standalone -g backoffice -m orders:cancellations`
- `autometa run --standalone -m backoffice:orders:cancellations`
