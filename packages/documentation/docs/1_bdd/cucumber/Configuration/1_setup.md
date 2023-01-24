# Setup & Configuration

To start configuring `autometa`, create a file near the root of your project called `automation.setup.ts` (or any name of your choosing) and add it to `jest.config.[j|t]s` as a [setup file](https://jestjs.io/docs/configuration#setupfilesafterenv-array).

```ts title='jest.config.ts'
export default {
  setupFilesAfterEnv: ['reflect-metadata', './autometa.setup.ts'],
};
```

:::tip
This file is a good location to call `import reflect-metadata`.

```ts
import 'reflect-metadata';

Flags.enableGroupLogging();
```

:::

:::info
If a flag has a corresponding environment variable,
the environment variable when set will be prioritized.

E.g. if something is enabled in setup but "false" in a env variable, the flag will not be enabled
:::
From this new setup file you can configure the framework:

## [- Flags](./flags)
