# testrail-cucumber (rewrite)

This folder is the new home for the **Autometa** TestRail + Cucumber integration.

## Reference implementation

For a safe baseline to compare against, the original library from `main` has been copied into:

- `.reference/`

This folder is intentionally kept as a snapshot for inspection and migration planning.

## Next steps (planned)

- Define the new public API (CLI + programmatic)
- Decide on supported Cucumber variants (message protocol vs JSON vs JUnit)
- Implement a cleaner TestRail client layer (auth, retries, rate limits, idempotency)
- Add strong typing + tests + fixtures
