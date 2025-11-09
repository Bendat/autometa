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

### ➖ @autometa/file-proxies
**Location:** (legacy package)  
**Dependencies:** None  
**Status:** Not present in refactor workspace ➖

### ➖ @autometa/status-codes
**Location:** (legacy package)  
**Dependencies:** None  
**Status:** Not present in refactor workspace ➖

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

### ➖ @autometa/fixture-proxies
**Location:** (legacy package)  
**Dependencies:**
- ✅ @autometa/errors
- ✅ @autometa/types

**Status:** Not present in refactor workspace ➖  
**Notes:** Validate whether the app package still requires an equivalent module.

### ✅ @autometa/dto-builder
**Location:** `libraries/dto-builder` → `packages/dto-builder`  
**Dependencies:**
- ✅ @autometa/injection

**Status:** Migrated ✅  
**Note:** Keep an eye on downstream packages consuming legacy decorators to ensure alignment.

---

## Level 2: Depends on Level 0-1

### 🚧 @autometa/events
**Location:** `packages/events`  
**Dependencies:**
- ✅ @autometa/errors
- ✅ @autometa/gherkin
- ✅ @autometa/types

**Status:** In Progress 🚧 (rewriting dispatcher + lifecycle payloads)
**Notes:** New hook kinds and lifecycle event names land with the v1 emitter/dispatcher updates—downstream packages will need to replace legacy beforeEach/afterEach handlers with stage-specific hooks before migration.

### ✅ @autometa/phrases
**Location:** `packages/phrases`  
**Dependencies:**
- ✅ @autometa/asserters
- ✅ @autometa/bind-decorator
- ✅ @autometa/errors

**Status:** Migrated ✅  
**Notes:** Downstream consumers will likely need updates for the new phrases API surface—plan dependency audits to confirm compatibility.

### ⏸️ @autometa/app
**Location:** `packages/app`  
**Dependencies:**
- ✅ @autometa/asserters
- ✅ @autometa/errors
- ➖ @autometa/fixture-proxies (legacy dependency – confirm replacement)
- ✅ @autometa/injection
- ✅ @autometa/phrases

**Status:** Blocked (awaiting fixture-proxies replacement strategy) ⏸️

---

## Level 3: Depends on Level 0-2

### ✅ @autometa/datetime
**Location:** `packages/datetime`  
**Dependencies:**
- ✅ @autometa/asserters
- ✅ @autometa/errors
- ✅ @autometa/phrases

**Status:** Migrated ✅ (injectable clock, modern date/time factories, full coverage)

### ⏸️ @autometa/config
**Location:** `packages/config`  
**Dependencies:**
- ⏸️ @autometa/app
- ⏸️ @autometa/asserters
- ✅ @autometa/errors
- ✅ @autometa/types

**Status:** Blocked (needs app, asserters) ⏸️

### ⏸️ @autometa/http
**Location:** `packages/http`  
**Dependencies:**
- ⏸️ @autometa/app
- ✅ @autometa/dto-builder
- ✅ @autometa/errors
- ✅ @autometa/injection
- ➖ @autometa/status-codes (legacy dependency – confirm replacement)

**Status:** Blocked (needs app plus decision on status-codes replacement) ⏸️

---

## Level 4+: Complex Dependencies

### ⏸️ @autometa/cucumber-expressions
**Location:** `packages/cucumber-expressions`  
**Dependencies:**
- ⏸️ @autometa/app
- ✅ @autometa/asserters
- ⏸️ @autometa/datetime
- ✅ @autometa/errors
- ✅ @autometa/overloaded
- ✅ @autometa/types

**Status:** Blocked (needs app, datetime) ⏸️

### ⏸️ @autometa/scopes
**Location:** `packages/scopes`  
**Dependencies:**
- ⏸️ @autometa/app
- ✅ @autometa/bind-decorator
- ⏸️ @autometa/cucumber-expressions
- ✅ @autometa/dto-builder
- ✅ @autometa/errors
- 🚧 @autometa/events
- ✅ @autometa/gherkin
- ✅ @autometa/overloaded
- ✅ @autometa/phrases
- ✅ @autometa/types

**Status:** Blocked (needs app, cucumber-expressions, events) ⏸️

### ⏸️ @autometa/test-builder
**Location:** `packages/test-builder`  
**Dependencies:**
- ⏸️ @autometa/app
- ✅ @autometa/asserters
- ✅ @autometa/bind-decorator
- ✅ @autometa/dto-builder
- ✅ @autometa/errors
- 🚧 @autometa/events
- ✅ @autometa/gherkin
- ✅ @autometa/phrases
- ⏸️ @autometa/scopes
- ✅ @autometa/types

**Status:** Blocked (needs app, events, scopes) ⏸️

### ⏸️ @autometa/jest-executor
**Location:** `packages/jest-executor`  
**Dependencies:**
- ⏸️ @autometa/app
- ✅ @autometa/asserters
- ⏸️ @autometa/config
- ✅ @autometa/errors
- 🚧 @autometa/events
- ✅ @autometa/gherkin
- ✅ @autometa/injection
- ⏸️ @autometa/scopes
- ⏸️ @autometa/test-builder
- ✅ @autometa/types

**Status:** Blocked (needs app, config, events, scopes, test-builder) ⏸️

### ⏸️ @autometa/coordinator
**Location:** `packages/coordinator`  
**Dependencies:**
- ⏸️ @autometa/app
- ✅ @autometa/asserters
- ⏸️ @autometa/config
- ✅ @autometa/errors
- 🚧 @autometa/events
- ✅ @autometa/gherkin
- ⏸️ @autometa/jest-executor
- ⏸️ @autometa/scopes
- ⏸️ @autometa/test-builder
- ✅ @autometa/types

**Status:** Blocked (needs app, config, events, jest-executor, scopes, test-builder) ⏸️

### ⏸️ @autometa/jest-transformer
**Location:** `packages/jest-transformer`  
**Dependencies:**
- ⏸️ @autometa/runner

**Status:** Blocked (needs runner) ⏸️

### ⏸️ @autometa/runner
**Location:** `packages/runner`  
**Dependencies:** (Almost everything - 19 packages)
- ⏸️ @autometa/app
- ✅ @autometa/asserters
- ✅ @autometa/bind-decorator
- ⏸️ @autometa/config
- ⏸️ @autometa/coordinator
- ⏸️ @autometa/cucumber-expressions
- ⏸️ @autometa/datetime
- ✅ @autometa/errors
- 🚧 @autometa/events
- ➖ @autometa/file-proxies (legacy)
- ➖ @autometa/fixture-proxies (legacy)
- ✅ @autometa/gherkin
- ⏸️ @autometa/http
- ✅ @autometa/injection
- ⏸️ @autometa/jest-executor
- ✅ @autometa/phrases
- ⏸️ @autometa/scopes
- ⏸️ @autometa/test-builder
- ✅ @autometa/types

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
5. ➖ @autometa/file-proxies (legacy)
6. ➖ @autometa/status-codes (legacy)

### Phase 3: Level 1 Dependencies
7. ✅ @autometa/injection (depends on types)
8. ✅ @autometa/asserters (depends on errors)
9. ➖ @autometa/fixture-proxies (legacy)
10. ✅ @autometa/gherkin (already done)

### Phase 4: Level 2 Dependencies
11. 🚧 @autometa/events (depends on errors, gherkin, types) *(in progress)*
12. ✅ @autometa/phrases (depends on asserters, bind-decorator, errors)
13. ✅ @autometa/dto-builder (depends on injection)

### Phase 5: Level 3 Dependencies
14. @autometa/app (blocked on fixture-proxies replacement)
15. ⏳ @autometa/datetime (depends on asserters, errors, phrases)
16. @autometa/config (depends on app, asserters, errors, types)
17. @autometa/http (depends on app, dto-builder, errors, injection, status-codes)

### Phase 6: Complex Integration Packages
18. @autometa/cucumber-expressions
19. @autometa/scopes
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

**Migrated:** 9 packages (types, errors, overloaded, gherkin, bind-decorator, injection, asserters, dto-builder, phrases)  
**Ready to migrate:** 1 package (datetime)  
**In progress:** 1 package (events)  
**Blocked:** 11 active packages (app, config, http, cucumber-expressions, scopes, test-builder, jest-executor, coordinator, runner, plus pending decisions on fixture-proxies/status-codes replacements)  
**Total:** 22 tracked packages (including legacy slots)

**Next Up:** @autometa/datetime ⭐
