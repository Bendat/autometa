---
sidebar_position: 7
---

# Tag Filtering

Autometa supports [Tag Expressions](https://cucumber.io/docs/cucumber/api/?lang=kotlin#tag-expressions).

To filter tests by tag, either define an environment variable `CUCUMBER_FILTER_TAGS` with a tag expression, or pass a tag expression string
to `tagFilter` in `defineConfig`

```ts
import { defineConfig } from "@autometa/cucumber-runner";

defineConfig({
  tagFilter: "@a and not @b",
  // ...
});
```
