# Participants & Focus Groups

In order to define user behaviors we must first define a `Participant`. To define a participant, we must create a `Participants` class, which
is a `FocusGroup` of your product.

A participant is simply a user of your product. They may have different roles relating to the user roles of your system. For example, an online store may have "Customers" and "Sellers" who use your product in different but related ways. A "Customer" purchase products from your store, while a "Seller" make items available for sale.

Participants have Promise Like behavior. Behaviors they will perform
can be added in chained methods, which will be executed when the Participant is `await`'d

A participants Class is a simple class that defines at least one
Participant. This will be a Focus Group testing your product.

Focus Groups are lead by one member - the Facilitator - who controls
the WebDriver instance.

Participants are described using decorators. The decorators
for a Participant are:

- `@Role(string)` - The role of the participant user of your product. For example
  a user who only purchases or books a product might be a "Customer" while
  a user who sells their service through your platform might be a "Seller".

- `@Browses(string | URL)` - the URL of the web page of your product which
  this user will start browsing from during their test. A "Customer"
  might visit `YourSite.com` while a seller might visit `portal.YourSite.com`

- `@Facilitator` - The lead participant of a Focus Group. This participant is responsible for starting and stopping the primary WebDriver session.

:::info

Currently only the Facilitator is supported for tests. Patterns for multi user scenarios are under development.
:::

The Focus Group of Participants also has decorators:
`@Browser` - Provides a Selenium Web Driver Builder which
will create a WebDriver at test time.

Example Focus Group of participants:

```ts
import { myWebDriverBuilder, envUrls } from '../';
import { Community, User, decorator, browses } from '@autometa/behaviors';

@Browser(myWebDriverBuilder)
export class Users {
  @Role('Registered Customer')
  @Browses(envUrls.productUrl)
  @Facilitator
  Johnny: participant;

  @Role('Guest Customer')
  @Browses(envUrls.productUrl)
  Jimmy: participant;

  @Role('Seller')
  @Browses(envUrls.sellerPortalUrl)
  Jenny: participant;
}
```

:::tip
You may wish to maintain multiple Focus Groups for different suites of tests, configured for certain contexts. You can have as many Focus Groups as you wish.
:::

To create a test with users, we call the `FocusGroup.begin` method before test execution, passing in the community of `Participants` we created. `begin` will return the Facilitator of the focus group
which must be assigned:

```ts
describe('My Homepage Tests', () => {
  let Johnny: User;

  beforeEach(() => (Johnny = FocusGroup.begin(Users)));
});
```

A Participant can describe behavior they _will see_ through [Observations](./observations) and _will take_ through [Actions](./actions)

## Executing Participants

A Participant collects Actions and Observations through the
`will`, `and` and `see` methods which can be chained. A Participant has Promise-like behavior, executing its Behaviors in the order
they were provided once the user has been `await`ed. A Participant
can only be executed once - running them with new behaviors after completing will result in an error.

```ts
await Johnny.will(DoSomething).and.see(Page, HasTitle('Some Title'));
await Johnny; // Error: Johnny has already completed his behaviors
```

Participant actions are lazy, and do not execute until the Participant
themselves has been awaited, or the `then` method is called.

```ts title=Example
await Johnny;
```

The example above does nothing (except start the WebDriver), as Johnny is not scheduled to perform any actions or observations:

```ts
Johnny.will(Login).and(Logout);
```

This example also does nothing despite two actions being described. This is because they are asynchronous events and cannot execute without an `await` or a call to `then` (calls to `then` are discouraged).

```ts
await Johnny.will(Login).and(Logout);
```

The above will execute both actions in their defined order.
