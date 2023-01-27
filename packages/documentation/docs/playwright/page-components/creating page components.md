# Defining Page Components

## Creating a Page Component Class

A Page Component needs to simply extend the `PageComponent` class to be
useable:

```ts
import {
  PageComponent,
  Locate,
  By,
} from '@autometa/page-components-playwright';

export class HomepageComponent extends PageComponent {}
```

Which can now be created during a test. Since this is our root component (the page itself) we use the highest level relevant element, such as `body`:

```ts
import { test, expect } from '@playwright/test';
import { HomepageComponent } from '../src/components/homepage';

test.describe('Homepage Tests', () => {
  let homepage: HomepageComponent;

  test.beforeEach(({ page }) => {
    homepage = PageComponent.browse(HomepageComponent, page.locator('body));
  });

  test('Confirms the Homepage contains "Hello World"', async () => {
    await expect(homepage).toContainText('Hello World');
  });
});
```

Alternatively the `HomepageComponent` could be defined by a fixture:

```ts
import { test as base } from '@playwright/test';
import { Homepage } from '../src/components/homepage';

export type Options = { defaultItem: string };

// Extend basic test by providing a "homepage" fixture.
// This can be placed in a different file and imported instead
// of the @playwright import
export const test = base.extend<Options & { homepage: Homepage }>({
  homepage: async ({ page }, use) => {
    const homepage = await PageComponent.browse(
      HomepageComponent,
      page.locate('body')
    );
    await use(homepage);
  },
});

test.describe('Homepage Tests', () => {
  test('Confirms the Homepage contains "Hello World"', async ({ hompage }) => {
    await expect(homepage).toContainText('Hello World');
  });
});
```

With a root defined, we can add child page Components:

```ts
export class HomepageComponent extends PageComponent {
  @Placeholder('Search for products...')
  searchBar: PageComponent;

  @TestId('search-button')
  searchButton: PageComponent;
}
```
:::info
The decorators match a locator strategy from Page or Locator:
* `@Placeholder` - `Locator.getByPlaceholder`
* `@TestId` - `Locator.getByTestId`
* `@Aria` - `Locator.getByRole`
* `@AltText` - `Locator.getByAltText`
* `@Text` - `Locator.getByText`
* `@Label` - `Locator.getByLabel`
* `@Title` - `Locator.getByTitle`
* `@Locate` - `Locator.locator`
:::

Which can use in our tests:

```ts
test.describe('Homepage Tests', () => {
  test('Searches for "Widgets"', async ({ hompage }) => {
    await homepage.searchBar.fill('Widgets');
    await homepage.searchButton.click();
    await expect(homepage).toContainText('Results for Widgets:');
  });
});
```

The component can also be written to encapsulate behavior:

```ts
export class HomepageComponent extends PageComponent {
  @Placeholder('Search for products...')
  searchBar: PageComponent;

  @TestId('search-button')
  searchButton: PageComponent;

  search = async (text: string | Regexp) => {
    await searchBar.fill(text);
    await searchButton.click();
  };
}

// /tests/homepage-tests.ts
test.describe('Homepage Tests', () => {
  test('Searches for "Widgets"', async ({ hompage }) => {
    await homepage.search('Widget');
    await expect(homepage).toContainText('Results for Widgets:');
  });
});
```

## Defining Sub-Components

Page Components can be built to represent any scope of the web page
and composed together. For example, as well as search bar and search button, our Homepage may have a compex search results container with
a filter bar

```ts
export class SearchFilterWidget {
  @Label('In Stock:')
  inStockCheckbox: PageComponent;

  @Label('Color:')
  itemColorDropdown: PageComponent;
  
  @Label('Size:')
  itemSizeDropDown: PageComponent;
}

export class SearchResultsWidget extends PageComponent {
  @Locate('#search-filters')
  filters: SearchFilterWidget;

  @Locate('.result-item')
  resultItems: PageComponent;
}

export class HomepageComponent extends PageComponent {
  @Placeholder('Search for products...')
  searchBar: PageComponent;

  @TestId('search-button')
  searchButton: PageComponent;

  @Locate('#search-results')
  searchResults: SearchResultsWidget;

  search = async (text: string | Regexp) => {
    await searchBar.fill(text);
    await searchButton.click();
  };
}
```

To reduce chaining (if disearable) destructuring may be used. For safety,
define page component methods as fat arrow functions.

```ts
// test file
test.describe('Homepage Tests', async ({
  homepage: {
    search,
    searchResults: { resultItems, inStockCheckbox },
  },
}) => {
  await search('Widget');
  await expect(resultItems).toHaveCount(8);
  await inStockCheckbox.check();
  await expect(resultItems).toHaveCount(6);
  await expect(searchRes);
  await expect(homepage).toContainText('Results for Widgets:')
});
```
