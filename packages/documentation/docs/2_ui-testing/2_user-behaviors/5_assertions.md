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
export function Is<T>(expected: T): AssertionFn {
  return async function Is<K>(comparedTo: K | T) {
    expect(await comparedTo).toBe(expected);
  };
}

// Elements on the WebPage are typically strings, so this
// assertion will attempt to cast them to numbers and
// fail if that is not possible
export function IsNumber(expected?: number): AssertionFn {
  return async function IsNumber(
    comparedTo: number | string | Promise<number | string>
  ) {
    const parsed = Number(await comparedTo);
    expect(parsed).not.toBeNaN();
    if (expected) {
      expect(parsed).toEqual(expected);
    }
  };
}
```

:::info
Most assertions use Jest assertions under the hood.
:::

## Default Assertions

The following assertions are provided by default:

- `Is(expected: T)` - Deep equals between two objects
- `Equals(expected: T)` - Identity equals between two objects
- `IsNumber(expected?: number)` - Checks a element text is numeric, and equal to the expected value: '1' == 1 and 1 === 1
- `IsApproximately(expected: number, precision: number)` - Checks an element text is numeric and approximately equal to the expected value within some precision (2.001 is approximately 2 with a precision of 0.0.1)
- `IsGreaterThan(expected: number)` - Checks an element text is numeric and greater than the expected value.
- `HasTitle(title: string, within: ThoughtFor = Within(2, Seconds))` - Checks the loaded window has the expected title, waiting the provided time (default 2 seconds) before it fails. Equivalent to Selenium's `.waitForTitleIs()`)
- `TitleContains(title: string, within: ThoughtFor = Within(2, Seconds))` - Checks the loaded window title contains the expected text - equivalent to Selenium's `.waitForTitleContains`
- `TitleMatches(title: Regexp, within: ThoughtFor = Within(2, Seconds))` - Checks the loaded window title matches (with Regular Expressions) the expected text - equivalent to Selenium's `.waitForTitleMatches`
- `HasUrl(url: string | URL, within: ThoughtFor = Within(2, Seconds))` - Checks the loaded window has the expected title, waiting the provided time (default 2 seconds) before it fails. Equivalent to Selenium's `.waitForUrlIs()`)
- `UrlContains(url: string, within: ThoughtFor = Within(2, Seconds))` - Checks the loaded window URL contains the expected text - equivalent to Selenium's `.waitForURLContains`
- `UrlMatches(url: Regexp, within: ThoughtFor = Within(2, Seconds))` - Checks the loaded window URL matches (with Regular Expressions) the expected text - equivalent to Selenium's `.waitForUrlMatches`
