# Asynchronous Step Definitions

The callbacks for `Feature`, `Scenario`, `Background` etc do not allow for async functions so this should be avoided:

```ts
Feature(async ({ Scenario }) => {
  Scenario('', async () => {});
});
```

**Steps** however _can_ be async or return a promise.

The following is allowed:

```ts
Feature(({ Scenario }) => {
  Scenario('', ({ Given }) => {
    Given('', async () => {
      await someActionAsync();
    });
  });
});
```

## With Promises

You can avoid making a callback async by simply returning a promise directly at the end of the step

```ts
Feature(({ Scenario }) => {
  Scenario('', ({ Given }) => {
    Given('', () => {
      return someActionAsync();
    });
  });
});
```
