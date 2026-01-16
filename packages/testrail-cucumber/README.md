# @autometa/testrail-cucumber

Upload Cucumber `.feature` files to TestRail with idempotent matching via a stable signature.

This package provides the `testrail-cucumber` CLI.

See also: the Autometa docs page (Reference → TestRail Cucumber CLI).

## CLI

### Install

```bash
pnpm add -D @autometa/testrail-cucumber
```

### Interactive Mode

Simply run `testrail-cucumber` without any command to enter interactive mode:

```bash
testrail-cucumber
```

Interactive mode provides a guided experience that:
- Shows your current login status and configuration
- Only prompts for missing credentials or settings
- Walks you through sync/plan operations step-by-step
- Automatically detects single vs multi-suite projects

All commands below are also available for direct CLI usage and automation.

### Authentication

Credentials can be provided via flags, environment variables, or stored credentials:

- `--testrail-url` or `TESTRAIL_URL`
- `--testrail-username` or `TESTRAIL_USERNAME`
- `--testrail-password` or `TESTRAIL_PASSWORD`
- `--project-id` or `TESTRAIL_PROJECT_ID`

#### Storing credentials locally

For convenience you can save credentials once and skip the flags on subsequent runs:

```bash
testrail-cucumber login
```

This prompts for URL, username, password, and an optional default project ID, then stores them securely in your home directory (`~/.config/autometa/testrail-credentials.json` on macOS/Linux, `%APPDATA%\autometa\...` on Windows). The file is created with mode `0600` (owner read/write only).

Once logged in, commands like `sync` and `plan` will use the stored credentials automatically when you omit the CLI flags.

To remove stored credentials:

```bash
testrail-cucumber logout
```

To update just the URL without re-entering credentials:

```bash
testrail-cucumber set-url https://new-testrail.example.com
```

To update the default project ID:

```bash
testrail-cucumber set-project 123
```

To customize tag prefixes (these are stored and used by default in subsequent syncs):

```bash
testrail-cucumber set-case-tag-prefix @C
testrail-cucumber set-suite-tag-prefix @S
testrail-cucumber set-section-tag-prefix @SEC
```

Once set, these prefixes will be used automatically when writing tags with `--write-tags`. You can still override them per-sync using `--case-tag-prefix`, `--suite-tag-prefix`, or `--section-tag-prefix` flags.

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

## Scenario Outline Handling

By default, each Scenario Outline becomes a single test case in TestRail. You can change this behaviour to create sections and individual test cases per data row.

### Configuration

Store your preferred settings:

```bash
# Treat outlines as sections (instead of cases)
testrail-cucumber set-outline-is section

# Treat Examples tables as sections (instead of flattening rows)
testrail-cucumber set-example-is section

# Control where case tags are placed (above Examples or inline in table)
testrail-cucumber set-example-case-tag-placement above  # or "inline"
```

Or use CLI flags per-sync:

```bash
testrail-cucumber sync foo --outline-is section --example-is section --example-case-tag-placement inline
```

### Modes

| `--outline-is` | `--example-is` | Result |
| --- | --- | --- |
| `case` (default) | n/a | One test case per Scenario Outline |
| `section` | `case` | Outline → Section, all rows → Cases under that section |
| `section` | `section` | Outline → Section, Examples → Subsections, rows → Cases |

### Tag Writeback

When `--outline-is section`:

- If `--example-is case`: Row case tags are written above the Scenario Outline line:
  ```gherkin
  @testrail-case-101 @testrail-case-102 @testrail-section-500
  Scenario Outline: my outline
  ```

- If `--example-is section` with `--example-case-tag-placement above` (default):
  ```gherkin
  @testrail-case-101 @testrail-case-102 @testrail-section-501
  Examples:
    | param  |
    | value1 |
    | value2 |
  ```

- If `--example-is section` with `--example-case-tag-placement inline`:
  ```gherkin
  @testrail-section-501
  Examples:
    | param  | testrail case         |
    | value1 | @testrail-case-101 |
    | value2 | @testrail-case-102 |
  ```

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
