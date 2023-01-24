# Logging & Console

This package provides a `GroupLogger` class which enables
`console.group` like behavior. Useful for debugging, or when
tests will be run consecutively [see Async](#async).

The `console` module can also be overwritten to use `GroupLogger` internally and reenable console groups (which are disabled in node due to its Async nature) globally in your project.

Grouping can be enabled by calling `useConsoleGroups`, and disabled
with `disableConsoleGroups`.

To start a console group call `console.group('some title here')`,
and to end it call `console.groupEnd()`.

For example take the following code:

```ts
const logger = new GroupLogger();
logger.group('Outer Group');
logger.group('Inner Group');
logger.log('Http Request Sent');
logger.log('Http Response Received');
logger.groupEnd();
logger.groupEnd();
```

_or with console groups enabled_

```ts
console.group('Outer Group');
console.group('Inner Group');
console.log('Http Request Sent');
console.log('Http Response Received');
console.groupEnd();
console.groupEnd();
```

Which will produce the following output

```
Outer Group
  Inner Group
     [Log]
     Http Request Sent
     /path/to/file:8:11

     [Log]
     Http Response Received
     /path/to/file:9:11

```

## Checked Grouping

To confirm groups are being ended when expected, the `startGroup` and `endGroup`
functions can be used.

`startGroup` takes a `ConsoleGroupToken` or a string and begins a console group.
`endGroup` also takes a ConsoleGroupToken or a string, and will raise
a warning message if groups are being ended in the wrong order.

### ConsoleGroupToken

The `ConsoleGroupToken` is an empty enum. It can be replaced by custom
enum values by declaring the type somewhere in your project.

```ts
// in 'typings.d.ts' or similar file
declare module '@autometa/logging' {
  export enum ConsoleGroupToken {
    Scenario = 'Scenario',
    Test = 'Test',
  }
}
```

Which can now be used directly

```ts
startGroup(ConsoleGroupToken.Scenario);
```

`startGroup` can also accept additional values which will be displayed in the group title

```ts
startGroup(ConsoleGroupToken.Scenario, 'first', 1);
// prints
// Scenario: first, 1
```

## Grouping

Alternatively the `grouping` function can be used. `grouping` takes
a title and an action. The action is executed and the group is closed again before the error is propagated.

Grouping will return the value of an action directly. If the action returns
a promise, then `grouping` can be `await`ed

```ts
grouping('a group', () => {
  doStuff();
});

await grouping('an async group', async () => {
  return someAsyncJob();
});
```

## Async

Grouping only makes sense in a synchronous context. Groups
should only be written outside of async functions which
are not immediately awaited.

However async actions can be run within a group - just be sure they're
all completed before ending it.
