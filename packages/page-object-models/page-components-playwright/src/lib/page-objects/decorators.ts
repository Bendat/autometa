import { Class } from '@autometa/shared-utilities';
import test, { Locator } from '@playwright/test';
import { By } from '../locator';
import { PageComponent, PageComponentOptions } from './component';

export function WrapComponent(_, key, descriptor: PropertyDescriptor) {
  const originalDescriptor = descriptor.value;
  const fn = {
    [key]: async function (...args: unknown[]) {
      const result: Locator = await originalDescriptor.call(this, ...args);
      const options: PageComponentOptions = { locator: result, parent: this };
      return new PageComponent(options);
    },
  };
  descriptor.value = fn[key];
}

function browse<T extends PageComponent>(
  component: Class<T>,
  locator: Locator
) {}
test('', ({ page }) => {
  const component = browse(PageComponent, page.locator('body'));
});
