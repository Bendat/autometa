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

### ⏸️ @autometa/bind-decorator
**Location:** `libraries/bind-decorator` → `packages/bind-decorator`  
**Dependencies:** None  
**Status:** Ready to migrate ⏳

### ⏸️ @autometa/file-proxies
**Location:** `packages/file-proxies`  
**Dependencies:** None  
**Status:** Ready to migrate ⏳

### ⏸️ @autometa/status-codes
**Location:** `libraries/status-codes` → `packages/status-codes`  
**Dependencies:** None  
**Status:** Ready to migrate ⏳

---

## Level 1: Depends on Level 0 Only

### ✅ @autometa/gherkin
**Location:** `packages/gherkin`  
**Dependencies:** 
- ✅ @autometa/errors
- ✅ @autometa/overloaded
- ✅ @autometa/types
- ⏸️ @autometa/bind-decorator (on main)
- 🔄 @autometa/dto-builder (migrated on this branch, not on main)

**Status:** Migrated ✅ (using branch version of dto-builder)

### ⏸️ @autometa/injection
**Location:** `packages/injection`  
**Dependencies:**
- ✅ @autometa/types

**Status:** Ready to migrate ⏳

### ⏸️ @autometa/asserters
**Location:** `packages/asserters`  
**Dependencies:**
- ✅ @autometa/errors

**Status:** Ready to migrate ⏳

### ⏸️ @autometa/fixture-proxies
**Location:** `packages/fixture-proxies`  
**Dependencies:**
- ✅ @autometa/errors
- ✅ @autometa/types

**Status:** Ready to migrate ⏳

### ⏸️ @autometa/dto-builder
**Location:** `libraries/dto-builder` → `packages/dto-builder`  
**Dependencies:**
- ⏸️ @autometa/injection

**Status:** Blocked (needs injection) ⏸️  
**Note:** Already exists on refactor branch, may need sync/validation

---

## Level 2: Depends on Level 0-1

### ⏸️ @autometa/events
**Location:** `packages/events`  
**Dependencies:**
- ✅ @autometa/errors
- ✅ @autometa/gherkin
- ✅ @autometa/types

**Status:** Ready to migrate ⏳

### ⏸️ @autometa/phrases
**Location:** `packages/phrases`  
**Dependencies:**
- ⏸️ @autometa/asserters
- ⏸️ @autometa/bind-decorator
- ✅ @autometa/errors

**Status:** Blocked (needs asserters, bind-decorator) ⏸️

### ⏸️ @autometa/app
**Location:** `packages/app`  
**Dependencies:**
- ⏸️ @autometa/asserters
- ✅ @autometa/errors
- ⏸️ @autometa/fixture-proxies
- ⏸️ @autometa/injection
- ⏸️ @autometa/phrases

**Status:** Blocked (needs asserters, fixture-proxies, injection, phrases) ⏸️

---

## Level 3: Depends on Level 0-2

### ⏸️ @autometa/datetime
**Location:** `packages/datetime`  
**Dependencies:**
- ⏸️ @autometa/asserters
- ✅ @autometa/errors
- ⏸️ @autometa/phrases

**Status:** Blocked (needs asserters, phrases) ⏸️

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
- ⏸️ @autometa/dto-builder
- ✅ @autometa/errors
- ⏸️ @autometa/injection
- ⏸️ @autometa/status-codes

**Status:** Blocked (needs app, dto-builder, injection, status-codes) ⏸️

---

## Level 4+: Complex Dependencies

### ⏸️ @autometa/cucumber-expressions
**Location:** `packages/cucumber-expressions`  
**Dependencies:**
- ⏸️ @autometa/app
- ⏸️ @autometa/asserters
- ⏸️ @autometa/datetime
- ✅ @autometa/errors
- ✅ @autometa/overloaded
- ✅ @autometa/types

**Status:** Blocked (needs app, asserters, datetime) ⏸️

### ⏸️ @autometa/scopes
**Location:** `packages/scopes`  
**Dependencies:**
- ⏸️ @autometa/app
- ⏸️ @autometa/bind-decorator
- ⏸️ @autometa/cucumber-expressions
- ⏸️ @autometa/dto-builder
- ✅ @autometa/errors
- ⏸️ @autometa/events
- ✅ @autometa/gherkin
- ✅ @autometa/overloaded
- ⏸️ @autometa/phrases
- ✅ @autometa/types

**Status:** Blocked (needs app, bind-decorator, cucumber-expressions, dto-builder, events, phrases) ⏸️

### ⏸️ @autometa/test-builder
**Location:** `packages/test-builder`  
**Dependencies:**
- ⏸️ @autometa/app
- ⏸️ @autometa/asserters
- ⏸️ @autometa/bind-decorator
- ⏸️ @autometa/dto-builder
- ✅ @autometa/errors
- ⏸️ @autometa/events
- ✅ @autometa/gherkin
- ⏸️ @autometa/phrases
- ⏸️ @autometa/scopes
- ✅ @autometa/types

**Status:** Blocked (needs app, asserters, bind-decorator, dto-builder, events, phrases, scopes) ⏸️

### ⏸️ @autometa/jest-executor
**Location:** `packages/jest-executor`  
**Dependencies:**
- ⏸️ @autometa/app
- ⏸️ @autometa/asserters
- ⏸️ @autometa/config
- ✅ @autometa/errors
- ⏸️ @autometa/events
- ✅ @autometa/gherkin
- ⏸️ @autometa/injection
- ⏸️ @autometa/scopes
- ⏸️ @autometa/test-builder
- ✅ @autometa/types

**Status:** Blocked (needs app, asserters, config, events, injection, scopes, test-builder) ⏸️

### ⏸️ @autometa/coordinator
**Location:** `packages/coordinator`  
**Dependencies:**
- ⏸️ @autometa/app
- ⏸️ @autometa/asserters
- ⏸️ @autometa/config
- ✅ @autometa/errors
- ⏸️ @autometa/events
- ✅ @autometa/gherkin
- ⏸️ @autometa/jest-executor
- ⏸️ @autometa/scopes
- ⏸️ @autometa/test-builder
- ✅ @autometa/types

**Status:** Blocked (needs app, asserters, config, events, jest-executor, scopes, test-builder) ⏸️

### ⏸️ @autometa/jest-transformer
**Location:** `packages/jest-transformer`  
**Dependencies:**
- ⏸️ @autometa/runner

**Status:** Blocked (needs runner) ⏸️

### ⏸️ @autometa/runner
**Location:** `packages/runner`  
**Dependencies:** (Almost everything - 19 packages)
- ⏸️ @autometa/app
- ⏸️ @autometa/asserters
- ⏸️ @autometa/bind-decorator
- ⏸️ @autometa/config
- ⏸️ @autometa/coordinator
- ⏸️ @autometa/cucumber-expressions
- ⏸️ @autometa/datetime
- ✅ @autometa/errors
- ⏸️ @autometa/events
- ⏸️ @autometa/file-proxies
- ⏸️ @autometa/fixture-proxies
- ✅ @autometa/gherkin
- ⏸️ @autometa/http
- ⏸️ @autometa/injection
- ⏸️ @autometa/jest-executor
- ⏸️ @autometa/phrases
- ⏸️ @autometa/scopes
- ⏸️ @autometa/test-builder
- ✅ @autometa/types

**Status:** Blocked (needs almost everything) ⏸️

---

## Recommended Migration Order

Based on the dependency graph, here's the optimal migration sequence:

### Phase 1: Foundation (Level 0) ✅ Completed
1. ✅ @autometa/types
2. ✅ @autometa/errors
3. ✅ @autometa/overloaded

### Phase 2: Independent Utilities (Level 0 remaining)
4. ⏳ @autometa/bind-decorator
5. ⏳ @autometa/file-proxies
6. ⏳ @autometa/status-codes

### Phase 3: Level 1 Dependencies
7. ⏳ @autometa/injection (depends on types)
8. ⏳ @autometa/asserters (depends on errors) ⭐ **Next recommended**
9. ⏳ @autometa/fixture-proxies (depends on errors, types)
10. ✅ @autometa/gherkin (already done)

### Phase 4: Level 2 Dependencies
11. ⏳ @autometa/events (depends on errors, gherkin, types)
12. @autometa/phrases (depends on asserters, bind-decorator, errors)
13. @autometa/dto-builder (validate/sync existing migration)

### Phase 5: Level 3 Dependencies
14. @autometa/app (depends on asserters, errors, fixture-proxies, injection, phrases)
15. @autometa/datetime (depends on asserters, errors, phrases)
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

**Migrated:** 4 packages (types, errors, overloaded, gherkin)  
**Ready to migrate:** 6 packages (bind-decorator, file-proxies, status-codes, injection, asserters, fixture-proxies, events)  
**Blocked:** 13 packages  
**Total:** 23+ packages

**Next Up:** @autometa/asserters ⭐
