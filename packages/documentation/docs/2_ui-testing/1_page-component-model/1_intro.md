# Introduction

**Page Component Model** is an interpretation of the Page Object Model which intends to make Selenium automation easy.
:::caution
This is an experimental, WIP library that is not yet rigorously tested and should not be considered stable. `Semver` versioning is not yet in place.
:::

:::tip
This library requires a reflect poly-fill like [`reflect-metadata`](https://www.npmjs.com/package/reflect-metadata).
Ensure it's called early in your code, preferably in a setup script
:::

Autometa Page Component Model is a declarative page object model library for `TypeScript` which streamlines the definition
of page objects for Selenium users on node. It aims to automatically create and wire together all your page objects seamlessly
so you can focus on writing tests.

This package acts as an opinionated wrapper over Selenium, and attempts to minimize your direct contact with the WebDriver
or WebElements.

Components are automatically scoped to their parent for faster searching, and lazily loaded for faster loading and reducing brittleness.

## At a Glance

Autometa PCM defines pages with simple classes and decorators.

```ts title='Example Home Page Page Object Model'
export class MyHomePage extends WebPage {
  // reference pages which are navigable from the home page
  @page()
  results: ResultsPage;

  @page()
  signInPage: SignInPage;

  // zero instantiation/initialization. The Autometa does it for you.
  @component(By.id('search-bar'))
  searchBarInput: TextInput;

  @component(By.css('.style-container button'), Until.isVisible, 1500)
  searchButton: Button;
}
```

:::info

`Button` and `TextInput` are some of the default [Components](components) provided
by Autometa POM. Building your own custom components and connecting them to your page
objects is trivial and encouraged. While there are patterns provided for dealing
with containers, where possible it's best to define a custom component.
:::

Writing tests is also easy:

```ts title='Example with Jest or Mocha'
import { siteUrl, myDriver } from '../setup';
import { MyHomePage } from '../homepage';

describe('Searching on our homepage', () => {
  const site = Site(siteUrl, myDriver);
  let home: MyHomePage;

  beforeEach(async () => {
    home = await site.Browse(MyHomePage);
  });

  it('should search for puppies', () => {
    await home.searchBarInput.write('puppies');
    await home.searchButton.click();
    await site.waitForTitleIs('Search Results');

    const resultsCount = await site.results.length;
    const searchText = await site.results.searchBar.text;

    expect(resultsCount).toBe(5);
    expect(searchText).toBe('puppies');
  });

  afterEach(async () => {
    await site.quit();
  });
});
```

:::caution
Almost all interactions with selenium are asynchronous. Ensure you await or promise
chain your actions.
:::

# Benefits

This library aims to make the life of automation engineers easier by automating away the challenges
commonly faced writing stable selenium tests:

## Lazy Loading

Your entire page structure is initialized once you start your site, however your WebElements are
loaded _only_ when they are directly accessed, improving start up performance and reducing flakiness
due to changes to parts of the page your tests aren't interested in.

## Scoped Searching

When it's time for one of your Components to load it's underlying `WebElement`, it will only be searched
for as a descendent of it's parent Component. If the parent is a page, the `WebDriver` is used instead.

Advantages:

- Improves search performance - avoid searching the whole DOM for a WebElement.
- Simplifies Locators - searching for a tag by class will not find elements in other parts of the page. No need for complex CSS queries.

## Zero Instantiation

No need to instantiate your page objects or worry about their constructors and dependencies. Each Component
is automatically generated and assigned when your test starts.

## Declarative Model

Pages are models, not programs. Avoid logic in your page objects so you can focus on writing tests.

## Automatic Waiting

No need for explicit or implicit waits. Each Component knows what it needs to be considered valid. After discovering a WebElement,
it will automatically be waited for. Uses `isLocated` by default but can be overridden with decorators and by subclasses. Can be disabled.

## Human Mode/Slow Mode

Set a slow mode time to force selenium to run at a speed you can actually watch. Useful for debugging.

## Logging (WIP)

Automatically log your actions as they happen with readable `info` logs. Currently only node's default console
is supported. Logs will show as an action, followed by a 'breadcrumb' of the component executing that action.
The breadcrumb is the the full path to the component in the page model

Example log:

```sh
  console.info
    Clicking On IndexPage[$root] >
      GridContainer[grid, By(css selector, .grid)] >
        SimpleTypeDiv[simpleTypes, By(css selector, div:nth-of-type(1))] >
          Button[button, By(css selector, button)]( { text: "Click Me" } )

      at Button.#logActionOccurring (src/lib/meta-types/component.ts:558:17)

  console.info
    Searching for [ListItem, By(css selector, li)] in IndexPage[$root] >
      GridContainer[grid, By(css selector, .grid)] >
        SimpleTypeDiv[simpleTypes, By(css selector, div:nth-of-type(1))] >
          UnorderedList[unorderedList, By(css selector, ul)]

      at ElementArray.<anonymous> (src/lib/meta-types/component.ts:540:17)

  console.info
    Reading Text From IndexPage[$root] >
      GridContainer[grid, By(css selector, .grid)] >
        SimpleTypeDiv[simpleTypes, By(css selector, div:nth-of-type(1))] >
          UnorderedList[unorderedList, By(css selector, ul)] >
            ListItem[0, By(css selector, li)]( { text: "ul item 1" } )
```

## Automatic Staleness Handling

Sometimes elements move in the DOM, or a form causes a refreshed page, rendering your WebElements stale.
Components automatically detect when their underlying WebElement is stale and attempt to rediscover it
at least once and continuing your action before simply failing. Refreshes will propagate through out the page
model if necessary.

Alternatively, the entire Page Model can be forced to lazily reinitialize if you know it will be stale due to some
action occurring.
