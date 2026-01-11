---
"@autometa/app": major
"@autometa/asserters": major
"@autometa/assertions": major
"@autometa/bind-decorator": major
"@autometa/cli": major
"@autometa/config": major
"@autometa/coordinator": major
"@autometa/cucumber-expressions": major
"@autometa/datetime": major
"@autometa/dto-builder": major
"@autometa/errors": major
"@autometa/events": major
"@autometa/executor": major
"@autometa/file-proxies": major
"@autometa/fixture-proxies": major
"@autometa/gherkin": major
"@autometa/http": major
"@autometa/injection": major
"@autometa/jest-executor": major
"@autometa/jest-transformer": major
"@autometa/overloaded": major
"@autometa/phrases": major
"@autometa/playwright-executor": major
"@autometa/playwright-loader": major
"@autometa/runner": major
"@autometa/scopes": major
"@autometa/status-codes": major
"@autometa/test-builder": major
"@autometa/testrail-cucumber": major
"@autometa/types": major
"@autometa/vitest-executor": major
"@autometa/vitest-plugins": major
---

Autometa v1 rewrite: start the `-rc` prerelease line for the new major version series (HTTP is a breaking change from v1 and becomes v2).

This release candidate includes:

**Breaking Changes:**
- Complete v1 rewrite with new architecture and API
- HTTP package breaking changes (now v2)

**Fixes:**
- `dto-builder`: Omit undefined validator in extend config
- `dto-builder`: Factory extend with defaults and methods support
- `test-builder`: Avoid non-null assertions in edit distance calculation
- `assertions`: Move HTTP matcher placeholder out of test files
- `runner`: Make JSON.stringify(world) safe
- `http`: Avoid double query serialization in axios transport

**Improvements:**
- `testrail-cucumber`: Harden Gherkin parsing and attach rule metadata
- `cli`: Improve test stability (ANSI color handling, control regex)
- Build stability: Isolated tsbuildinfo for type builds
- CI workflows: Fixed shell quoting in version detection across all workflows
- Examples: Align tsconfigs and use this-bound step functions

**Documentation:**
- Expanded lifecycle and runtime architecture docs
- New discovery and from-scratch getting started guides
- Updated configuration and HTTP client reference
