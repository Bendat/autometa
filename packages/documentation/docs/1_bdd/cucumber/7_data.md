# Storing Data Between Tests

An issue arises with steps when data must be passed between them. In vanilla Cucumber, that is achieved with the [World](https://github.com/cucumber/cucumber-js/blob/main/docs/support_files/world.md) object.

As autometa is a structured test runner, it is possible to create objects inside the test `Scenario`s themselves.

```ts title='Using a plain object'
Feature(({ Scenario }) => {
  Scenario('Search Google', ({ Given, When, Then }) => {
    const data: any = {};
    Given('a user on the google homepage', () => {
      data.user = new User();
    });

    When('they search for {string} on google', async (searchTerm) => {
      data.result = await data.user.SearchGoogle(searchTerm);
    });

    Then('they see a result for {string}', (website) => {
      const desiredWebsite = getWebsite(website, data.result);
      expect(desireWebsite).toBeDefined();
      // other validations
    });
  });
}, './sample.feature');
```

This works, but there is no type safety and no way to communicate this object with shared steps.

```ts title='share-steps.ts'
const setupUser: Steps = ({ Given }) => {
    Given('a user on the google homepage', ()=>{
        data.user = new User() // uh-oh
    })
});
```

To work around it, shared steps can be wrapped
in a function which accepts the data object.

```ts title='share-steps.ts'
const setupUser: Steps = (data: any) => {
  return ({ Given }) => {
    Given('a user on the google homepage', () => {
      data.user = new User(); // ok
    });
  };
};
```

To reduce on boiler plate, you have access to...

## The World Object

The World object behaves similarly to vanilla cucumber. It is an empty object which accepts `any` value and returns `unknown` when accessed.

The World object is available in the second argument of the scenario
call back and can be destructured with the name `World`

```ts title="World Object
Feature(({ Scenario }) => {
  Scenario('Search Google', ({ Given, When, Then }, { World }) => {
    Given('a user on the google homepage', () => {
      World.user = new User();
    });

    When('they search for {string} on google', async (searchTerm) => {
      World.result = await data.user.SearchGoogle(searchTerm);
    });

    Then('they see a result for {string}', (website) => {
      const desiredWebsite = getWebsite(website, World.result);
      expect(desireWebsite).toBeDefined();
      // other validations
    });
  });
}, './sample.feature');
```

`World` is unique to each `Scenario` (including the scenarios of a `Scenario Outline`, and scenarios automatically constructed by [Automatic Scenarios](2_all-steps.md)).

`World` is automatically injected into all Shared Steps.

```ts title='share-steps.ts'
const setupUser: Steps = ({ Given }, { World }) => {
    Given('a user on the google homepage', ()=>{
        World.user = new User();
    })
});
```

## Store

Alternatively, like `World`, the second argument contains a unique `Store` object, which is also injected into Shared Steps.

Store caches values with its `put` method and they can be retrieved with `read`.

`put` takes a key, which is a string, and a value to store.

```ts title='put'
Scenario('a scenario', ({ When }, { Store }) => {
  // ... given code

  When('the the user POSTs their details', async () => {
    const response = await ServiceClient.post({ username: 'freddy' });
    Store.put('returnedResponse', response);
  });
});
```

`read` also takes a key and returns the value associated with it, if any, which can be cast to a type argument.

```ts title'read'
Scenario('a scenario', ({ Given }, { Store }) => {
  // ... given, when code

  Then('the user object is returned', () => {
    const expected = { username: 'freddy' };
    const response = Store.read<UserResponse>('providedNumber', numVal);
    expect(response).toBe(expected);
  });
});
```

Optionally, both methods accept validation options which if configured
will cause the `Store` instance to log a warning and/or throw an error
when a null or undefined value is passed to the store.

```ts
interface ValidationOptions {
  warn?: boolean;
  throws?: boolean;
}
```

When `warn` is set to true, and a value of null or undefined is added or accessed, it will cause a `console.warn` to be issued. If a read fails and `warn` is enabled, a report will be printing indicating if a value has ever been added for that key, or it was never `put`ted at all.

`throws` throws an error when a null or undefined value is found.

```ts
Store.put('returnedResponse', response, { warn: true });
....

const storedResponse = Store.read<UserObject>('returnedResponse', {
  throws: true,
});
```
