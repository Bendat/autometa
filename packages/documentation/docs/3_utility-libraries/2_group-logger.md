# Group Logger

Group Logger provides `console.group` like behavior (`console.group` is not fully enabled on Node due to it's async nature) either
through the `GroupLogger` class or by calling `useConsoleGroups` which
will override the `console` module.

Groups will indent all logs while they are open, and un-indent once closed. Groups should only be enabled if tests are run in sequence, or only a single test is being run for debugging.

For example, in Jest, each test file runs in sequence by default, but all executed test files run in their own individual process. As a result, groups from different files will be mixed together in the same log. This can be circumvented with `--runInBand` but this may hurt performance.

`GroupLogger` will track open groups, and print a warning if a group
is closed while it's descendant groups are still open.

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
