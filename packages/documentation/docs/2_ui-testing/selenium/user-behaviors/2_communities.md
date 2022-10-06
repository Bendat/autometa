# Communities & Users

In order to define user behaviors we must first define a `User`. To define
a user, we must define a `Community`.

A Community is a simple class which extends `Community`, and
describes a collections of `User`s. It can be configured to a certain
`WebDriver` `Builder` instance which will be shared across users in
the community.

Communities are lead by one member, and may contain only one member,
but multiple members can be used to facilitate multi user scenarios across
browsers or tabs.

Users can be defined with `role`s, which are primarily documentation
tags to indication the users role in the product lifecycle (this is their role as consumers of the product, not as characters. For example, you may have a `Registered User` for most users, and an `Admin` who has access to a admin portal)

Users are also configured with a url, which is the primary url they
are expected to operate on a test, but does not dictate what websites
they can visit during a test.

```ts
import { myWebDriverBuilder, envUrls } from '../';
import { Community, User, decorator, browses } from '@autometa/behaviors';

@driver(myWebDriverBuilder)
export class Users extends Community {
  @role('Registered User')
  @browses(envUrls.productUrl)
  Johnny: User;

  @role('Product Admin')
  @browses(envUrls.adminPortalUrl)
  Jenny: User;
}
```

:::tip
You may wish to maintain multiple communities for different suites of tests,
configured for certain contexts. You can have as many communities as you wish,
but only one will be active per test context.
:::
//@browses('https://www.saucedemo.com/')

To create a test with users, we call the `Community.of` method, passing
in the community of `Users` we created

```ts
describe('My Homepage Tests', () => {
  let Johnny: User;

  beforeEach(() => ({ Johnny } = Community.of(Users).following('Johnny')));
});
```

A test can also use multiple users from the community [see Multi User Scenarios](./intro)

```ts
describe('My Homepage Tests', () => {
  let Johnny: User;
  let Jenny: User;

  beforeEach(
    () => ({ Johnny, Jenny } = Community.of(Users).following('Johnny'))
  );
});
```

A user can describe behavior they _will see_ take through [Observations](./observations) and _will take_ [Actions](./actions)

## Executing Users

A user executes a chain of asynchronous actions which must be `await`d. The `User` object itself is `then`able, and it's behavior methods (`will`, `see`, `and`) all return an instance of their User object.

This means that webdriver actions do not execute when a behavior method is called. Instead they are processed and stored in a queue as asynchronous actions.

To execute a Users behaviors, the User object itself must be `await`ed. When awaited, the entire method chain up to that await will be executed in the order they were defined.

```ts title=Example
await Johnny;
```

The example above does nothing, as Johnny is not scheduled to perform any actions or observations:

```ts
Johnny.will(Login).and(Logout);
```

This example also does nothing despite two actions being described. This is because they are asynchronous events and cannot execute without an `await` or a call to `then` (calls to `then` are discouraged).

```ts
await Johnny.will(Login).and(Logout);
```

The above will execute both actions in their defined order.

```ts
await Johnny.will(Login);
await Johnny.will(Logout);
```

And the above will first execute Login to completion, then Logout to completion.