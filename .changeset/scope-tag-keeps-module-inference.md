---
"@autometa/cli": patch
"@autometa/vitest-plugins": patch
---

Fix `@scope(<group>)` so it does not downgrade module-inferred feature scope when the feature file lives under a configured module directory.

