---
"@autometa/example-jest-integration": patch
"@autometa/dto-builder": patch
"@autometa/injection": patch
"@autometa/http": patch
"@autometa/app": patch
---

fix: injection errors and http client hooks

- The new dependency injection library sometimes returned class prototypes instead of class instances due to inconsistent caching of decorated types.
- HTTP client hooks were not executing when certain builder methods were called.
