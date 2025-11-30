# Version & Changeset Migration Plan

> **Status:** Planning Document  
> **Goal:** Prepare all packages for `1.0.0-rc1` release candidate  
> **Exception:** `@autometa/http` → `2.0.0-rc1` (already released >1.0.0)

This document outlines the careful migration of changeset data from `main` branch and preparation of all packages for a unified release candidate version.

---

## 1. Current State Analysis

### 1.1 Package Version Status (Current Branch)

| Package | Current Version | Has CHANGELOG | Notes |
|---------|-----------------|---------------|-------|
| `@autometa/app` | `0.0.0` | ✅ | Reset to 0.0.0, has history |
| `@autometa/asserters` | `1.0.0` | ✅ | Already at 1.0.0 |
| `@autometa/assertions` | `0.0.0` | ❓ | **NEW PACKAGE** - verify |
| `@autometa/bind-decorator` | `0.0.0` | ✅ | Reset (was 0.5.1), **moved from libraries/** |
| `@autometa/cli` | `0.0.0` | ❓ | **NEW PACKAGE** |
| `@autometa/config` | `0.0.0` | ✅ | Reset |
| `@autometa/coordinator` | `0.0.0` | ✅ | Reset |
| `@autometa/cucumber-expressions` | `0.0.0` | ❓ | **NEW PACKAGE** - verify |
| `@autometa/datetime` | `0.0.0` | ✅ | Reset |
| `@autometa/dto-builder` | `0.13.11` | ✅ | Retained version, **moved from libraries/** |
| `@autometa/errors` | `0.2.2` | ✅ | Retained version |
| `@autometa/events` | `0.0.0` | ✅ | Reset |
| `@autometa/executor` | `0.0.0` | ❓ | **NEW PACKAGE** |
| `@autometa/file-proxies` | `0.0.0` | ✅ | Reset |
| `@autometa/fixture-proxies` | `0.0.0` | ✅ | Reset |
| `@autometa/gherkin` | `0.7.2` | ✅ | Retained version |
| `@autometa/http` | `0.0.0` | ✅ | **SPECIAL CASE** - was 1.4.20 on main |
| `@autometa/injection` | `0.1.5` | ✅ | Retained version |
| `@autometa/jest-executor` | `0.0.0` | ✅ | Reset |
| `@autometa/jest-transformer` | `0.0.0` | ✅ | Reset |
| `@autometa/overloaded` | `0.3.2` | ✅ | Retained version, **moved from libraries/** |
| `@autometa/phrases` | `0.0.0` | ✅ | Reset |
| `@autometa/runner` | `0.0.0` | ❓ | **NEW PACKAGE** |
| `@autometa/scopes` | `0.0.0` | ✅ | Reset |
| `@autometa/status-codes` | `0.0.0` | ✅ | Reset (was 0.4.1), **moved from libraries/** |
| `@autometa/test-builder` | `0.0.0` | ✅ | Reset |
| `@autometa/types` | `0.4.1` | ✅ | Retained version |
| `@autometa/vitest-executor` | `0.0.0` | ❓ | **NEW PACKAGE** |
| `@autometa/vitest-plugins` | `0.0.0` | ❓ | **NEW PACKAGE** |

### 1.2 Packages Requiring Special Attention

#### New Packages (not on main)
These packages need fresh CHANGELOGs created:
- `@autometa/assertions`
- `@autometa/cli`
- `@autometa/cucumber-expressions`
- `@autometa/executor`
- `@autometa/runner`
- `@autometa/vitest-executor`
- `@autometa/vitest-plugins`

#### Packages Moved from `libraries/` to `packages/`

| Package | Old Location | Version on Main | Current Version |
|---------|--------------|-----------------|-----------------|
| `@autometa/bind-decorator` | `libraries/bind-decorator` | `0.5.1` | `0.0.0` |
| `@autometa/dto-builder` | `libraries/dto-builder` | `0.13.11` | `0.13.11` ✅ |
| `@autometa/overloaded` | `libraries/overloaded` | `0.3.2` | `0.3.2` ✅ |
| `@autometa/status-codes` | `libraries/status-codes` | `0.4.1` | `0.0.0` |

**⚠️ Important:** When preserving CHANGELOGs for these packages, check `.reference/libraries/*/CHANGELOG.md` NOT `.reference/packages/*/CHANGELOG.md`.

#### Removed/Renamed Packages
- `@autometa/autometa` (umbrella package) - exists in `.reference/packages` but not in current `packages/`

#### HTTP Special Case
- **Main branch:** `1.4.20`
- **Current branch:** `0.0.0` (reset)
- **Target:** `2.0.0-rc1` (breaking changes, new major version)

---

## 2. Migration Steps

### Phase 1: Verify Changeset Configuration

**File:** `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@2.3.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

**Actions:**
1. [ ] Verify `baseBranch` is correct (may need to be `refactor/v1-rewrite` temporarily)
2. [ ] Consider adding private/internal packages to `ignore` array if any exist

### Phase 2: Preserve Historical CHANGELOGs

**⚠️ Check BOTH locations for historical data:**
- `.reference/packages/*/CHANGELOG.md` - for most packages
- `.reference/libraries/*/CHANGELOG.md` - for bind-decorator, dto-builder, overloaded, status-codes

For packages that have historical changelogs:

**Actions:**
1. [ ] Compare each CHANGELOG.md in `packages/*/CHANGELOG.md` with reference location
2. [ ] Ensure historical entries are preserved
3. [ ] Add a clear separator indicating the v1 rewrite

**Template for CHANGELOG separator:**
```markdown
# @autometa/package-name

## 1.0.0-rc1

### Major Changes

- Complete rewrite for Autometa v1
- [List breaking changes]
- [List new features]

---

## Pre-v1 Releases

> The following releases are from before the v1 rewrite.

## 0.x.x
...
```

**Packages with CHANGELOGs in `.reference/libraries/`:**
1. [ ] `packages/bind-decorator/CHANGELOG.md` ← `.reference/libraries/bind-decorator/CHANGELOG.md`
2. [ ] `packages/dto-builder/CHANGELOG.md` ← `.reference/libraries/dto-builder/CHANGELOG.md`
3. [ ] `packages/overloaded/CHANGELOG.md` ← `.reference/libraries/overloaded/CHANGELOG.md`
4. [ ] `packages/status-codes/CHANGELOG.md` ← `.reference/libraries/status-codes/CHANGELOG.md`

**Packages with CHANGELOGs in `.reference/packages/`:**
1. [ ] `packages/app/CHANGELOG.md`
2. [ ] `packages/asserters/CHANGELOG.md`
3. [ ] `packages/config/CHANGELOG.md`
4. [ ] `packages/coordinator/CHANGELOG.md`
5. [ ] `packages/datetime/CHANGELOG.md`
6. [ ] `packages/errors/CHANGELOG.md`
7. [ ] `packages/events/CHANGELOG.md`
8. [ ] `packages/file-proxies/CHANGELOG.md`
9. [ ] `packages/fixture-proxies/CHANGELOG.md`
10. [ ] `packages/gherkin/CHANGELOG.md`
11. [ ] `packages/http/CHANGELOG.md`
12. [ ] `packages/injection/CHANGELOG.md`
13. [ ] `packages/jest-executor/CHANGELOG.md`
14. [ ] `packages/jest-transformer/CHANGELOG.md`
15. [ ] `packages/phrases/CHANGELOG.md`
16. [ ] `packages/scopes/CHANGELOG.md`
17. [ ] `packages/test-builder/CHANGELOG.md`
18. [ ] `packages/types/CHANGELOG.md`

### Phase 3: Create CHANGELOGs for New Packages

For each new package, create `CHANGELOG.md`:

```markdown
# @autometa/package-name

## 1.0.0-rc1

### Major Changes

- Initial release as part of Autometa v1
- [Key features]
```

**New packages requiring CHANGELOGs:**
1. [ ] `packages/assertions/CHANGELOG.md`
2. [ ] `packages/cli/CHANGELOG.md`
3. [ ] `packages/cucumber-expressions/CHANGELOG.md`
4. [ ] `packages/executor/CHANGELOG.md`
5. [ ] `packages/runner/CHANGELOG.md`
6. [ ] `packages/vitest-executor/CHANGELOG.md`
7. [ ] `packages/vitest-plugins/CHANGELOG.md`

### Phase 4: Set Package Versions

#### Standard Packages → `1.0.0-rc1`

Update `package.json` version field for all packages EXCEPT http:

```bash
# All packages except @autometa/http
"version": "1.0.0-rc1"
```

**Packages to update:**
- [ ] `@autometa/app`
- [ ] `@autometa/asserters`
- [ ] `@autometa/assertions`
- [ ] `@autometa/bind-decorator`
- [ ] `@autometa/cli`
- [ ] `@autometa/config`
- [ ] `@autometa/coordinator`
- [ ] `@autometa/cucumber-expressions`
- [ ] `@autometa/datetime`
- [ ] `@autometa/dto-builder`
- [ ] `@autometa/errors`
- [ ] `@autometa/events`
- [ ] `@autometa/executor`
- [ ] `@autometa/file-proxies`
- [ ] `@autometa/fixture-proxies`
- [ ] `@autometa/gherkin`
- [ ] `@autometa/injection`
- [ ] `@autometa/jest-executor`
- [ ] `@autometa/jest-transformer`
- [ ] `@autometa/overloaded`
- [ ] `@autometa/phrases`
- [ ] `@autometa/runner`
- [ ] `@autometa/scopes`
- [ ] `@autometa/status-codes`
- [ ] `@autometa/test-builder`
- [ ] `@autometa/types`
- [ ] `@autometa/vitest-executor`
- [ ] `@autometa/vitest-plugins`

#### HTTP Package → `2.0.0-rc1`

```json
{
  "name": "@autometa/http",
  "version": "2.0.0-rc1"
}
```

### Phase 5: Update Internal Dependencies

All `workspace:*` dependencies should resolve correctly. After version bump:

1. [ ] Run `pnpm install` to update lockfile
2. [ ] Verify all internal dependencies resolve
3. [ ] Check for any circular dependency issues

### Phase 6: Create Release Changeset

Create a changeset file for the RC release:

**File:** `.changeset/v1-release-candidate.md`

```markdown
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
"@autometa/runner": major
"@autometa/scopes": major
"@autometa/status-codes": major
"@autometa/test-builder": major
"@autometa/types": major
"@autometa/vitest-executor": major
"@autometa/vitest-plugins": major
---

Autometa v1 Release Candidate

This is the first release candidate for Autometa v1, a complete rewrite of the framework.

### Breaking Changes

- Complete architectural overhaul
- New package structure
- Updated APIs across all packages

### New Packages

- `@autometa/cli` - Command-line interface with smart orchestrator
- `@autometa/runner` - Core test runner with scope-aware execution
- `@autometa/executor` - Test execution engine
- `@autometa/vitest-plugins` - Vitest integration
- `@autometa/vitest-executor` - Vitest executor bridge
- `@autometa/assertions` - Assertion utilities
- `@autometa/cucumber-expressions` - Cucumber expression support
```

---

## 3. Verification Checklist

### Pre-Migration
- [ ] All tests passing on current branch
- [ ] No uncommitted changes
- [ ] Backup of `.reference/` directory exists

### Post-Migration
- [ ] All `package.json` versions are correct
- [ ] All CHANGELOGs exist and have proper headers
- [ ] `pnpm install` succeeds without errors
- [ ] All tests still pass
- [ ] `pnpm build` succeeds for all packages
- [ ] Changeset status shows expected packages

### Release Readiness
- [ ] Run `pnpm changeset status` - verify all packages listed
- [ ] Run `pnpm changeset version` in dry-run mode
- [ ] Review generated CHANGELOG entries
- [ ] Verify npm access for publishing

---

## 4. Rollback Plan

If issues are encountered:

1. **Git Reset:** All changes are committed incrementally, allowing `git reset --hard` to specific commits
2. **Reference Backup:** `.reference/` contains original package data
3. **Version Restore:** Can restore versions from `.reference/packages/*/package.json` and `.reference/libraries/*/package.json`

---

## 5. Post-RC Process

After successful RC release:

1. Gather feedback from early adopters
2. Address critical bugs with `1.0.0-rc2`, `1.0.0-rc3`, etc.
3. When stable, release `1.0.0` (and `2.0.0` for http)
4. Update documentation
5. Announce release

---

## 6. Commands Reference

```bash
# Check changeset status
pnpm changeset status

# Create new changeset
pnpm changeset

# Version packages (applies changesets)
pnpm changeset version

# Publish packages
pnpm changeset publish

# Dry-run publish
pnpm changeset publish --dry-run
```

---

## Appendix A: Package Inventory from Main

### From `.reference/packages/`

| Package | Version on Main |
|---------|-----------------|
| `@autometa/app` | `0.4.2` |
| `@autometa/asserters` | `0.1.8` |
| `@autometa/autometa` | (umbrella) |
| `@autometa/config` | `0.1.2+` |
| `@autometa/coordinator` | TBD |
| `@autometa/cucumber-expressions` | TBD |
| `@autometa/datetime` | `0.1.16` |
| `@autometa/errors` | `0.2.2` |
| `@autometa/events` | `0.3.2` |
| `@autometa/file-proxies` | TBD |
| `@autometa/fixture-proxies` | TBD |
| `@autometa/gherkin` | `0.7.2+` |
| `@autometa/http` | `1.4.20` |
| `@autometa/injection` | `0.1.5` |
| `@autometa/jest-executor` | TBD |
| `@autometa/jest-transformer` | TBD |
| `@autometa/phrases` | TBD |
| `@autometa/scopes` | TBD |
| `@autometa/test-builder` | `0.4.2` |
| `@autometa/types` | `0.4.1` |

### From `.reference/libraries/`

| Package | Version on Main |
|---------|-----------------|
| `@autometa/bind-decorator` | `0.5.1` |
| `@autometa/dto-builder` | `0.13.11` |
| `@autometa/overloaded` | `0.3.2` |
| `@autometa/status-codes` | `0.4.1` |

---

## Appendix B: Execution Script (Optional)

A script can be created to automate version updates:

```typescript
// scripts/set-rc-versions.mjs
import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const RC_VERSION = '1.0.0-rc1';
const HTTP_VERSION = '2.0.0-rc1';

const packageJsonFiles = globSync('packages/*/package.json');

for (const file of packageJsonFiles) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  
  if (pkg.name === '@autometa/http') {
    pkg.version = HTTP_VERSION;
  } else {
    pkg.version = RC_VERSION;
  }
  
  writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Updated ${pkg.name} to ${pkg.version}`);
}
```

---

**Document Version:** 1.1  
**Created:** 2024-11-30  
**Last Updated:** 2024-11-30
