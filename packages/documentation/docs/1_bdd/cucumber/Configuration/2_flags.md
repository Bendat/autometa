# Flags

Flags are toggles which can be method chained.
They are accessible through the `Flags` object

```ts title='autometa.setup.ts'
import { Flags } from '@autometa/cucumber';

Flags.enableLoggingGroups();
```

:::tip
Flag methods return a `Flags` instance and can
be chained.
:::

## Available Flags:

### enableLoggingGroups()

Enables logging groups. When enabled, logs
will be indented and un-indented as tests and
steps complete, making it easier to understand the execution
of your test.

Will not work as expected if used asynchronously or concurrently - while
async code can be run inside a group, groups should not be created in async code
that is not forced to synchronize.

It will also likely display incorrectly when running multiple files in jest at once,
as they will be run concurrently. This can be worked around with `--runInBand`, however this may
hurt performance.

If the environment variable `USE_LOGGING_GROUPS` is set, it will take priority.

When enabled, test logs will take the shape of their gherkin counterpart

```
Feature: Some Feature
    Scenario: Some Scenario
        Given some given step
            [Log]
            some user generated log
            /path/to/log:8:40
        When some when step
            [Info]
            http client recieved response: {message: 'howdy'}
            /path/to/log:11:9

```
