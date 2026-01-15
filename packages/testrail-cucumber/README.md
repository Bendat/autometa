# @autometa/testrail-cucumber

Upload Cucumber `.feature` files to TestRail with idempotent matching via a stable signature.

This package provides the `testrail-cucumber` CLI.

See also: the Autometa docs page (Reference → TestRail Cucumber CLI).

## CLI

### Install

```bash
pnpm add -D @autometa/testrail-cucumber
```

### Authentication

Credentials can be provided via flags or environment variables:

- `--testrail-url` or `TESTRAIL_URL`
- `--testrail-username` or `TESTRAIL_USERNAME`
- `--testrail-password` or `TESTRAIL_PASSWORD`
- `--project-id` or `TESTRAIL_PROJECT_ID`

### Plan vs Sync

- Plan without touching TestRail:
  - `testrail-cucumber plan <patterns...> --existing-cases existing.json`
- Sync to TestRail:
  - `testrail-cucumber sync <patterns...> --testrail-url ... --testrail-username ... --testrail-password ... --project-id ...`

Patterns can be:

- A directory (expanded to `**/*.feature` under that directory)
- A `.feature` file
- A glob (e.g. `features/**/*.feature`)

### Multi-suite (suite-based) projects

If your TestRail project uses **multi-suite mode** (`suite_mode=3`), you must provide one of:

- `--suite-id <id>`
- `--suite-name <name>`
- `--default-suite-name <name>`

If the project is single-suite, any suite arguments are ignored.

### Duplicate policy and interactive mode

Ambiguous matches are controlled by `--duplicate-policy`:

- `error` (fail)
- `skip` (ignore the ambiguous node)
- `create-new` (create a new case)
- `prompt` (ask you to choose)

By default, if you omit `--duplicate-policy`:

- in a terminal (TTY): it uses `prompt`
- in CI (non-TTY): it uses `error`

You can explicitly disable prompting:

- `--no-interactive --duplicate-policy error`

## Tagging

- After sync, write tags back into feature files:
  - `--write-tags` (defaults to `@testrail-case-<id>` and `@testrail-suite-<id>`).
- Tag-only workflow:
  - `sync --dry-run --write-tags --write-tags-on-dry-run` (writes tags without creating/updating cases).

## Examples

Sync all feature files under a folder into TestRail project `1` (multi-suite) using a suite name:

```bash
testrail-cucumber sync foo \
  --project-id 1 \
  --suite-name "My Suite" \
  --testrail-url https://testrail.example.com \
  --testrail-username you@example.com \
  --testrail-password "$TESTRAIL_API_KEY" \
  --update-existing \
  --write-tags
```

Non-interactive / CI-safe sync:

```bash
testrail-cucumber sync foo \
  --project-id 1 \
  --suite-id 123 \
  --no-interactive \
  --duplicate-policy error
```
