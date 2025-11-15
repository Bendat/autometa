# Autometa v1 Migration Checklist

This document tracks the migration of all packages from `main` to the v1 refactor branch. Packages are ordered by dependency level (leaf packages first, then packages that depend on them).

## Migration Status Legend
- ✅ **Migrated** - Package has been refactored and committed
- 🚧 **In Progress** - Currently being worked on
- ⏳ **Ready** - All dependencies migrated, ready to start
- ⏸️ **Blocked** - Waiting on dependencies
- ➖ **N/A** - Not migrating (deprecated, removed, or merged)

---

## Level 0: No Dependencies (Leaf Packages)

### ✅ @autometa/types
**Location:** `packages/types`  
**Dependencies:** None  
**Status:** Migrated ✅

### ✅ @autometa/errors
**Location:** `packages/errors`  
**Dependencies:** None  
**Status:** Migrated ✅

### ✅ @autometa/overloaded
**Location:** Previously `libraries/overloaded`, now `packages/overloaded`  
**Dependencies:** None  
**Status:** Migrated ✅

### ✅ @autometa/bind-decorator
**Location:** `libraries/bind-decorator` → `packages/bind-decorator`  
**Dependencies:** None  
**Status:** Migrated ✅

### ✅ @autometa/file-proxies
**Location:** `packages/file-proxies`  
**Dependencies:** None  
**Status:** Migrated ✅  
**Notes:** Modernized sync/async proxy APIs with JSON helpers and fresh Vitest coverage.

### ✅ @autometa/status-codes
**Location:** `packages/status-codes`  
**Dependencies:** None  
**Status:** Migrated ✅

---

## Level 1: Depends on Level 0 Only

### ✅ @autometa/gherkin
**Location:** `packages/gherkin`  
**Dependencies:** 
- ✅ @autometa/errors
- ✅ @autometa/overloaded
- ✅ @autometa/types
- ✅ @autometa/bind-decorator
- ✅ @autometa/dto-builder

**Status:** Migrated ✅

### ✅ @autometa/injection
**Location:** `packages/injection`  
**Dependencies:**
- ✅ @autometa/types

**Status:** Migrated ✅

### ✅ @autometa/asserters
**Location:** `packages/asserters`  
**Dependencies:**
- ✅ @autometa/errors

**Status:** Migrated ✅

### ✅ @autometa/fixture-proxies
**Location:** `packages/fixture-proxies`  
**Dependencies:**
- ✅ @autometa/errors
- ✅ @autometa/types

**Status:** Migrated ✅  
**Notes:** Provides v2 access tracking and error boundary helpers; aligned with new app lifecycle.

### ✅ @autometa/dto-builder
**Location:** `libraries/dto-builder` → `packages/dto-builder`  
**Dependencies:**
- ✅ @autometa/injection

**Status:** Migrated ✅  
**Note:** Keep an eye on downstream packages consuming legacy decorators to ensure alignment.

---

## Level 2: Depends on Level 0-1

### ✅ @autometa/events
**Location:** `packages/events`  
**Dependencies:**
- ✅ @autometa/errors
- ✅ @autometa/gherkin
- ✅ @autometa/types

**Status:** Migrated ✅ (new dispatcher/emitter API with lifecycle payloads)
**Notes:** Downstream packages must adopt the stage-specific hook helpers introduced in the v1 emitter/dispatcher.

### ✅ @autometa/phrases
**Location:** `packages/phrases`  
**Dependencies:**
- ✅ @autometa/asserters
- ✅ @autometa/bind-decorator
- ✅ @autometa/errors

**Status:** Migrated ✅  
**Notes:** Downstream consumers will likely need updates for the new phrases API surface—plan dependency audits to confirm compatibility.

### ✅ @autometa/app
**Location:** `packages/app`  
**Dependencies:**
- ✅ @autometa/asserters
- ✅ @autometa/errors
- ✅ @autometa/fixture-proxies
- ✅ @autometa/injection
- ✅ @autometa/phrases

**Status:** Migrated ✅ (baseline lifecycle landed; tracking follow-up discoveries separately)

---

## Level 3: Depends on Level 0-2

### ✅ `@autometa/datetime`
**Location:** `packages/datetime`  
**Dependencies:**
- ✅ @autometa/asserters
- ✅ @autometa/errors
- ✅ @autometa/phrases

**Status:** Migrated ✅ (injectable clock, modern date/time factories, full coverage)

### ✅ @autometa/config
**Location:** `packages/config`  
**Dependencies:**
- ✅ @autometa/app
- ✅ @autometa/asserters
- ✅ @autometa/errors
- ✅ @autometa/types

**Status:** Migrated ✅ (environment-aware config resolver + Zod schema baseline landed)

### ✅ @autometa/http
**Location:** `packages/http`  
**Dependencies:**
- ✅ @autometa/app
- ✅ @autometa/dto-builder
- ✅ @autometa/errors
- ✅ @autometa/injection
- ✅ @autometa/status-codes

**Status:** Migrated ✅ (HTTP client/server helpers aligned with v1 status-code strategy)

---

## Level 4+: Complex Dependencies

### ✅ @autometa/cucumber-expressions
**Location:** `packages/cucumber-expressions`  
**Dependencies:**
- 🚧 @autometa/app
- ✅ @autometa/asserters
- ✅ `@autometa/datetime`
- ✅ @autometa/errors
- ✅ @autometa/overloaded
- ✅ @autometa/types

**Status:** Migrated ✅ (transform system complete; follow-up integration with app pending)

### ✅ @autometa/scopes
**Location:** `packages/scopes`  
**Dependencies:**
- ✅ @autometa/app
- ✅ @autometa/bind-decorator
- ✅ @autometa/cucumber-expressions
- ✅ @autometa/dto-builder
- ✅ @autometa/errors
- ✅ @autometa/events
- ✅ @autometa/gherkin
- ✅ @autometa/overloaded
- ✅ @autometa/phrases
- ✅ @autometa/types

**Status:** Migrated ✅ (Scopes DSL rebuilt with execution adapter, decorator registry, immutable metadata handling, and accompanying test coverage)

### ✅ @autometa/test-builder
**Location:** `packages/test-builder`  
**Dependencies:**
- ✅ @autometa/app
- ✅ @autometa/asserters
- ✅ @autometa/bind-decorator
- ✅ @autometa/dto-builder
- ✅ @autometa/errors
- ✅ @autometa/events
- ✅ @autometa/gherkin
- ✅ @autometa/phrases
- ✅ @autometa/scopes
- ✅ @autometa/types

**Status:** Migrated ✅ (builder core, internal helpers, and colocated specs ported under `src/__tests__`)

### ⏳ @autometa/jest-executor
**Location:** `packages/jest-executor`  
**Dependencies:**
- ✅ @autometa/app
- ✅ @autometa/asserters
- ✅ @autometa/config
- ✅ @autometa/errors
- ✅ @autometa/events
- ✅ @autometa/gherkin
- ✅ @autometa/injection
- ✅ @autometa/scopes
- ✅ @autometa/test-builder
- ✅ @autometa/types

**Status:** Ready ⏳ (all dependencies migrated; queued behind executor planning)

### ⏸️ @autometa/coordinator
**Location:** `packages/coordinator`  
**Dependencies:**
- ✅ @autometa/app
- ✅ @autometa/asserters
- ✅ @autometa/config
- ✅ @autometa/errors
- ✅ @autometa/events
- ✅ @autometa/gherkin
- ⏸️ @autometa/jest-executor
- ✅ @autometa/scopes
- ✅ @autometa/test-builder
- ✅ @autometa/types

**Status:** Blocked ⏸️ (awaiting @autometa/jest-executor)

### ⏸️ @autometa/jest-transformer
**Location:** `packages/jest-transformer`  
**Dependencies:**
- ⏸️ @autometa/runner

**Status:** Blocked (needs runner) ⏸️

### ⏸️ @autometa/runner
**Location:** `packages/runner`  
**Dependencies:** (Almost everything - 19 packages)
- ✅ @autometa/app
- ✅ @autometa/asserters
- ✅ @autometa/bind-decorator
- ✅ @autometa/config
- ⏸️ @autometa/coordinator
- ✅ @autometa/cucumber-expressions
- ✅ `@autometa/datetime`
- ✅ @autometa/errors
- ✅ @autometa/events
- ✅ @autometa/file-proxies
- ✅ @autometa/fixture-proxies
- ✅ @autometa/gherkin
- ✅ @autometa/http
- ✅ @autometa/injection
- ⏸️ @autometa/jest-executor
- ✅ @autometa/phrases
- ✅ @autometa/scopes
- ✅ @autometa/test-builder
- ✅ @autometa/types
- ✅ @autometa/status-codes

**Status:** Blocked (needs remaining application-layer packages plus decisions on legacy modules) ⏸️

---

## Recommended Migration Order

Based on the dependency graph, here's the optimal migration sequence:

### Phase 1: Foundation (Level 0) ✅ Completed
1. ✅ @autometa/types
2. ✅ @autometa/errors
3. ✅ @autometa/overloaded

### Phase 2: Independent Utilities (Level 0 remaining)
4. ✅ @autometa/bind-decorator
5. ✅ @autometa/file-proxies
6. ➖ @autometa/status-codes (legacy)

### Phase 3: Level 1 Dependencies
7. ✅ @autometa/injection (depends on types)
8. ✅ @autometa/asserters (depends on errors)
9. ✅ @autometa/fixture-proxies (migrated alongside Level 1 utilities)
10. ✅ @autometa/gherkin (already done)

### Phase 4: Level 2 Dependencies
11. ✅ @autometa/events (depends on errors, gherkin, types)
12. ✅ @autometa/phrases (depends on asserters, bind-decorator, errors)
13. ✅ @autometa/dto-builder (depends on injection)

### Phase 5: Level 3 Dependencies
14. ✅ @autometa/app (baseline lifecycle complete)
15. ⏳ `@autometa/datetime` (depends on asserters, errors, phrases)
16. ✅ @autometa/config (depends on app, asserters, errors, types)
17. @autometa/http (depends on app, dto-builder, errors, injection, status-codes)

### Phase 6: Complex Integration Packages
18. ✅ @autometa/cucumber-expressions
19. ✅ @autometa/scopes
20. @autometa/test-builder
21. @autometa/jest-executor
22. @autometa/coordinator

### Phase 7: Top-Level Aggregators
23. @autometa/runner
24. @autometa/jest-transformer

---

## Notes

- **@autometa/autometa** appears in packages but has no package.json - may be deprecated or a meta-package
- **@autometa/dto-builder** already exists on refactor branch but is still in libraries/ on main
- Packages from `libraries/` will be moved to `packages/` during migration
- Focus on completing Level 0-1 packages before moving to higher levels
- **Current recommendation:** Start with `@autometa/asserters` as it only depends on the already-migrated `@autometa/errors`

---

## Current Progress

**Migrated:** 20 packages (types, errors, overloaded, gherkin, bind-decorator, file-proxies, injection, asserters, dto-builder, phrases, `@autometa/datetime`, events, fixture-proxies, status-codes, app, cucumber-expressions, scopes, test-builder, http, config)  
**Ready to migrate:** 1 package (`@autometa/jest-executor`)  
**In progress:** 0 packages  
**Blocked:** 3 active packages (coordinator, runner, jest-transformer)  
**Total:** 22 tracked packages (including legacy slots)

**Next Up:** Begin `@autometa/jest-executor` to unlock coordinator and runner.
