---
sidebar_position: 9
---

# TestRail Cucumber CLI

The `@autometa/testrail-cucumber` package provides a `testrail-cucumber` command-line tool for **planning** and **syncing** Cucumber `.feature` files to TestRail.

It is designed to be:

- **Idempotent**: it uses a stable signature to match scenarios/rules back to existing TestRail cases.
- **Safe by default**: it supports dry-run planning and non-interactive operation for CI.
- **Multi-suite aware**: it can resolve and tag suites for projects that use TestRail multi-suite mode.

## Install

```bash
pnpm add -D @autometa/testrail-cucumber
```

## Quick start

### Sync a directory

Sync all `.feature` files under `foo/` into TestRail project `1`:

```bash
testrail-cucumber sync foo \
  --testrail-url https://your.testrail.instance \
  --testrail-username you@example.com \
  --testrail-password "$TESTRAIL_API_KEY" \
  --project-id 1 \
  --suite-name "My Suite"
```

Notes:

- If you pass a directory, the CLI expands it to `**/*.feature` under that directory.
- For **multi-suite** projects (`suite_mode=3`), you must provide a suite selector (`--suite-id`, `--suite-name`, or `--default-suite-name`).

### Plan only (no writes)

```bash
testrail-cucumber plan foo \
  --project-id 1 \
  --suite-name "My Suite" \
  --testrail-url https://your.testrail.instance \
  --testrail-username you@example.com \
  --testrail-password "$TESTRAIL_API_KEY"
```

`plan` prints what would happen and does not mutate TestRail.

## Authentication

You can provide credentials via flags or environment variables:

- `--testrail-url` or `TESTRAIL_URL`
- `--testrail-username` or `TESTRAIL_USERNAME`
- `--testrail-password` or `TESTRAIL_PASSWORD`
- `--project-id` or `TESTRAIL_PROJECT_ID`

## Commands

### `testrail-cucumber plan`

Plans how feature files would map to TestRail cases.

```bash
testrail-cucumber plan <patterns...> [options]
```

Common options:

| Option | Description |
| --- | --- |
| `--existing-cases <path>` | Provide a JSON file with `ExistingCase[]` to match against (optional). |
| `--duplicate-policy <policy>` | How to handle ambiguous matches: `error\|skip\|create-new\|prompt`. Defaults to `prompt` in TTY, otherwise `error`. |
| `--interactive` / `--no-interactive` | Enable/disable interactive prompts. Default: enabled. |
| `--force-prompt` | Allow prompting even with large candidate sets (unsafe). |
| `--max-prompt-candidates <n>` | Max candidates to show when prompting (default: 10). |
| `--suite-id <id>` | Select suite by id (multi-suite projects). |
| `--suite-name <name>` | Select suite by name (multi-suite projects; may be created if allowed). |
| `--default-suite-name <name>` | Fallback suite name (multi-suite projects; may be created if allowed). |
| `--create-missing-suite` | Allow creating suites when resolving by name (defaults to `false` for `plan`). |

### `testrail-cucumber sync`

Syncs feature files to TestRail (create/update cases), optionally writing tags back into `.feature` files.

```bash
testrail-cucumber sync <patterns...> [options]
```

Common options:

| Option | Description |
| --- | --- |
| `--dry-run` | Do not mutate TestRail; print plan only. |
| `--update-existing` | Update existing cases (title/description/steps). |
| `--duplicate-policy <policy>` | `error\|skip\|create-new\|prompt` (default: prompt in TTY, else error). |
| `--interactive` / `--no-interactive` | Enable/disable interactive prompts. |
| `--write-tags` | Write case id tags (and suite tag in multi-suite mode) back into feature files. |
| `--write-tags-on-dry-run` | When `--dry-run`, still write tags back to feature files. |
| `--case-tag-prefix <prefix>` | Case id tag prefix (default: `@testrail-case-`). |
| `--suite-tag-prefix <prefix>` | Suite id tag prefix (default: `@testrail-suite-`). |
| `--suite-id <id>` / `--suite-name <name>` | Required for multi-suite projects. |

## Multi-suite projects (suite-based)

The CLI checks `suite_mode` for your project:

- If the project is **single-suite** (`suite_mode != 3`), any `--suite-*` flags are ignored.
- If the project is **multi-suite** (`suite_mode = 3`), you must provide one of:
  - `--suite-id <id>`
  - `--suite-name <name>`
  - `--default-suite-name <name>`

When in multi-suite mode, the tool also prints and can write a suite tag like:

- `@testrail-suite-<suiteId>`

This is used for traceability and writeback.

## Interactive mode and CI

When `--duplicate-policy prompt` is used, the CLI may ask you to choose between candidates.

- In a TTY, the default is `prompt`.
- In a non-interactive environment (CI), the default becomes `error`.

To make behaviour deterministic in CI, use:

```bash
testrail-cucumber sync foo \
  --project-id 1 \
  --suite-id 123 \
  --no-interactive \
  --duplicate-policy error
```

## Tag writeback

After a successful sync, you can write tags into your `.feature` files:

```bash
testrail-cucumber sync foo \
  --project-id 1 \
  --suite-name "My Suite" \
  --write-tags
```

You can also run a **tag-only** workflow by combining `--dry-run` with writeback:

```bash
testrail-cucumber sync foo \
  --project-id 1 \
  --suite-name "My Suite" \
  --dry-run \
  --write-tags \
  --write-tags-on-dry-run
```

## Troubleshooting

### “Project is multi-suite… Provide --suite-id or --suite-name”

Your TestRail project is using multi-suite mode (`suite_mode=3`). Provide a suite selector.

### “Cannot prompt in non-interactive environment”

You hit a prompt-only flow without a TTY. Either:

- run in a terminal (TTY), or
- set `--no-interactive --duplicate-policy error`, or
- choose a non-prompt duplicate policy (`skip` / `create-new`).
