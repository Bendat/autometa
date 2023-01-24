import { By } from 'selenium-webdriver';
import { Until } from '../until/until';
export const COMPONENT_META_KEY = 'properties:decorated:component';
export const COLLECTION_META_KEY = 'properties:decorated:collections';

/**
 * Marks a property on a class as being a Component that
 * requires construction.
 *
 * Example:
 * ```
 * @InjectablePage()
 * export class MyWebPage extends WebPage{
 *  @component(Button, By.id('buy-btn'), Until.isVisible, 1500)
 *  buyBtn: Button
 * }
 * ```
 * @param by The locator for selenium to find the underlying WebElement of this Component
 * @param until A condition that must be met by the underlying WebElement for it to be considered as being in valid state
 * @param waitTimeout The amount of time to wait before throwing an Error when waiting for the {@see until} condition
 * @returns
 */
export function component(
  by: By,
  until?: Until,
  waitTimeout?: number
): PropertyDecorator {
  return (target: unknown, key: string | symbol): void => {
    const existing = Reflect.getMetadata(COMPONENT_META_KEY, target);
    const appended = {
      ...existing,
      [key]: { by, until, timeout: waitTimeout },
    };
    Reflect.defineMetadata(COMPONENT_META_KEY, appended, target);
  };
}
