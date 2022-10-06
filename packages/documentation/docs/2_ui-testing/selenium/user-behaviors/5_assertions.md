# Assertions

Assertions are functions which take the result of an `Observation` and
throw an error if a condition is not met.

Take for example the `Is` assertion, which throws an error if the value
extracted by an observer is not the same (type and value) as the provided
expected value.

For example take a `ProfilePage` with a text element `title`.
We can create an observation:

```ts
const ProfilePageTitle = Observe(ProfilePage, ({ title: { text } }) => text);
```

Which extracts the text of the element on the webpage.

It can be tested with `Is` in a test with the `see` method:

```ts
Johnny.will.see(ProfilePageTitle, Is('Hi Johnny!'));
```

To create a new assertion, simply define a function which accepts an expected value, and which returns another function (preferably with the same name) which
accepts a value from the observer.

```ts title='Provided Assertions'
export function Is<T>(value: T): AssertionFn {
  return async function Is<K>(comparedTo: K | T) {
    expect(await comparedTo).toBe(value);
  };
}

export function IsNumber(value?: number): AssertionFn {
  return async function IsNumber(comparedTo: number | Promise<number>) {
    expect(Number(await comparedTo)).not.toBeNaN();
    if (value) {
      expect(await comparedTo).toEqual(value);
    }
  };
}

export function Includes<T>(value: T): AssertionFn {
  return function Includes<K>(collection: K[]) {
    expect(collection).toContain(value);
  };
}
```

:::info
Most assertions use Jest assertions under the hood.
:::

## Default Assertions

The following assertions are provided by default:

- `Is(value: T)`
- `IsNumber(value?: number)`
- `Includes(value: T)`
- `StrictIncludes(value: T)`
- `IsApproximately(value: number, precision: number)`
- `IsGreaterThan(value: number)`
- `HasTitle(title: string, within: ThoughtFor = Within(2, Seconds))`
