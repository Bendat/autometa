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

@Locate(By.locator('body'))
export class HomepageComponent extends PageComponent {}
```

Which can now be created during a test:

```ts
import { test, expect } from '@playwright/test';
import { HomepageComponent } from '../src/components/homepage';

test.describe('Homepage Tests', () => {
  let homepage: HomepageComponent;

  test.beforeEach(({ page }) => {
    homepage = PageComponent.browse(HomepageComponent, page);
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
export const test = base.extend<Options & { homepage: Homepage }>({
  homepage: async ({ page }, use) => {
    const homepage = await PageComponent.browse(HomepageComponent, page);
    await use(homepage);
  },
});

test.describe('Homepage Tests', () => {
  test('Confirms the Homepage contains "Hello World"', async ({ hompage }) => {
    await expect(homepage).toContainText('Hello World');
  });
});
```
