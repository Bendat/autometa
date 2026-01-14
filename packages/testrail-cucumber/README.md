# @autometa/testrail-cucumber

Upload Cucumber `.feature` files to TestRail with idempotent matching via a stable signature.

## CLI

- Plan without touching TestRail:
  - `testrail-cucumber plan <patterns...> --existing-cases existing.json`
- Sync to TestRail:
  - `testrail-cucumber sync <patterns...> --testrail-url ... --testrail-username ... --testrail-password ... --project-id ...`

## Tagging

- After sync, write tags back into feature files:
  - `--write-tags` (defaults to `@testrail-case-<id>` and `@testrail-suite-<id>`).
- Tag-only workflow:
  - `sync --dry-run --write-tags --write-tags-on-dry-run` (writes tags without creating/updating cases).
