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

## Interactive Mode

For the easiest experience, run `testrail-cucumber` without any command to enter interactive mode:

```bash
testrail-cucumber
```

Interactive mode provides:
- A guided experience that walks you through each step
- Display of your current login status and configuration
- Smart prompting that only asks for missing credentials or settings
- Automatic detection of single vs multi-suite projects (no need to specify!)

All commands documented below remain available for direct CLI usage and automation.

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

You can provide credentials via flags, environment variables, or stored credentials:

- `--testrail-url` or `TESTRAIL_URL`
- `--testrail-username` or `TESTRAIL_USERNAME`
- `--testrail-password` or `TESTRAIL_PASSWORD`
- `--project-id` or `TESTRAIL_PROJECT_ID`

### Storing credentials locally

For convenience you can save credentials once and skip the flags on subsequent runs:

```bash
testrail-cucumber login
```

This prompts for URL, username, password, and an optional default project ID, then stores them securely in your home directory:

- **macOS / Linux**: `~/.config/autometa/testrail-credentials.json`
- **Windows**: `%APPDATA%\autometa\testrail-credentials.json`

The file is created with mode `0600` (owner read/write only).

Once logged in, commands like `sync` and `plan` will use the stored credentials automatically when you omit the CLI flags.

To remove stored credentials:

```bash
testrail-cucumber logout
```

## Commands

### `testrail-cucumber login`

Stores TestRail credentials securely on your device.

```bash
testrail-cucumber login [options]
```

| Option | Description |
| --- | --- |
| `--testrail-url <url>` | TestRail URL (or omit to prompt) |
| `--testrail-username <username>` | Username (or omit to prompt) |
| `--testrail-password <password>` | Password / API key (or omit to prompt) |
| `--project-id <id>` | Default project ID (optional) |

### `testrail-cucumber logout`

Removes stored credentials from your device.

```bash
testrail-cucumber logout
```

### `testrail-cucumber set-url`

Updates the stored TestRail URL without re-entering credentials.

```bash
testrail-cucumber set-url <url>
```

| Argument | Description |
| --- | --- |
| `<url>` | New TestRail base URL (e.g. `https://testrail.example.com`) |

### `testrail-cucumber set-project`

Updates the stored default project ID without re-entering credentials.

```bash
testrail-cucumber set-project <id>
```

| Argument | Description |
| --- | --- |
| `<id>` | Default TestRail project ID (number) |

### `testrail-cucumber set-case-tag-prefix`

Updates the stored case tag prefix for tag writeback.

```bash
testrail-cucumber set-case-tag-prefix <prefix>
```

| Argument | Description |
| --- | --- |
| `<prefix>` | Case ID tag prefix (e.g. `@testrail-case-` or `@C`) |

### `testrail-cucumber set-suite-tag-prefix`

Updates the stored suite tag prefix for tag writeback.

```bash
testrail-cucumber set-suite-tag-prefix <prefix>
```

| Argument | Description |
| --- | --- |
| `<prefix>` | Suite ID tag prefix (e.g. `@testrail-suite-` or `@S`) |

### `testrail-cucumber set-section-tag-prefix`

Updates the stored section tag prefix for tag writeback.

```bash
testrail-cucumber set-section-tag-prefix <prefix>
```

| Argument | Description |
| --- | --- |
| `<prefix>` | Section ID tag prefix (e.g. `@testrail-section-` or `@SEC`) |

Once these prefixes are set, they will be used automatically when syncing with `--write-tags`. You can still override them per-sync using the corresponding CLI flags (`--case-tag-prefix`, `--suite-tag-prefix`, `--section-tag-prefix`).

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
## Scenario Outline Handling

By default, each Scenario Outline becomes a single test case in TestRail. You can change this behaviour to create sections and individual test cases per data row.

### Configuration Commands

#### `testrail-cucumber set-outline-is`

Sets how Scenario Outlines are treated:

```bash
testrail-cucumber set-outline-is <mode>
```

| Argument | Description |
| --- | --- |
| `<mode>` | `case` (default) or `section` |

#### `testrail-cucumber set-example-is`

Sets how Examples tables are treated (only applies when `outline-is` is `section`):

```bash
testrail-cucumber set-example-is <mode>
```

| Argument | Description |
| --- | --- |
| `<mode>` | `case` (default) or `section` |

#### `testrail-cucumber set-example-case-tag-placement`

Sets where case tags are placed when writing back to feature files (only applies when `outline-is` is `section` and `example-is` is `section`):

```bash
testrail-cucumber set-example-case-tag-placement <placement>
```

| Argument | Description |
| --- | --- |
| `<placement>` | `above` (default) - tags above the Examples line, or `inline` - tags in a table column |

### CLI Flags

You can also use flags per-sync:

| Option | Description |
| --- | --- |
| `--outline-is <mode>` | How to treat Scenario Outlines: `case` or `section` |
| `--example-is <mode>` | How to treat Examples tables: `case` or `section` |
| `--example-case-tag-placement <placement>` | Where to place row case tags: `above` or `inline` |

### Modes Explained

| `--outline-is` | `--example-is` | TestRail Structure |
| --- | --- | --- |
| `case` (default) | n/a | One test case per Scenario Outline template |
| `section` | `case` | Outline → Section, all data rows → Cases directly under that section |
| `section` | `section` | Outline → Section, each Examples table → Subsection, rows → Cases |

### Tag Writeback with Outlines

When using `--outline-is section` with `--write-tags`:

**If `--example-is case`** (rows flattened under outline section):

Row case tags are written above the Scenario Outline line, in row order:

```gherkin
@testrail-case-101 @testrail-case-102 @testrail-case-103 @testrail-case-104
@testrail-section-500
Scenario Outline: my outline
  Given I do something with <param>

  Examples:
    | param  |
    | value1 |
    | value2 |
```

**If `--example-is section`** (Examples as subsections):

Tag placement depends on `--example-case-tag-placement`:

**With `--example-case-tag-placement above`** (default):

Case tags go above the Examples line:

```gherkin
@testrail-section-500
Scenario Outline: my outline
  Given I do something with <param>

  @testrail-case-101 @testrail-case-102 @testrail-section-501
  Examples:
    | param  |
    | value1 |
    | value2 |
```

**With `--example-case-tag-placement inline`**:

Case tags are added as a new table column:

```gherkin
@testrail-section-500
Scenario Outline: my outline
  Given I do something with <param>

  @testrail-section-501
  Examples:
    | param  | testrail case         |
    | value1 | @testrail-case-101 |
    | value2 | @testrail-case-102 |
```

## Troubleshooting

### “Project is multi-suite… Provide --suite-id or --suite-name”

Your TestRail project is using multi-suite mode (`suite_mode=3`). Provide a suite selector.

### “Cannot prompt in non-interactive environment”

You hit a prompt-only flow without a TTY. Either:

- run in a terminal (TTY), or
- set `--no-interactive --duplicate-policy error`, or
- choose a non-prompt duplicate policy (`skip` / `create-new`).
