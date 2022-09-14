import { By } from 'selenium-webdriver';
import { constructor } from 'tsyringe/dist/typings/types';
import { Component } from '../meta-types/component';
import { Until } from '../until/until';
import { ConstructionOptions, WaitOptions } from '../types';
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
  return (target: any, key): void => {
    const existing = Reflect.getMetadata(COMPONENT_META_KEY, target);
    const appended = {
      ...existing,
      [key]: { by, until, timeout: waitTimeout },
    };
    Reflect.defineMetadata(COMPONENT_META_KEY, appended, target);
  };
}
export interface CollectionDecoratorAdditionalConfig {
  collection: WaitOptions;
  innerComponent: ConstructionOptions<Component>;
}
/**
 * Marks a property as being a Collection of similar
 * Components. Provides array-like operations on it's
 * descendants
 * @param collectionBy The locator to find the Collection by
 * @param innerItemType The class blueprint of the descendant Components
 * @param itemBy The locator to find descendents by
 * @param options Additional options like `until`
 * @returns 
 */
export function collection<T extends Component>(
  collectionBy: By,
  innerItemType: constructor<T>,
  itemBy?: By,
  options?: CollectionDecoratorAdditionalConfig
): PropertyDecorator {
  return (target: Component, key): void => {
    const existing = Reflect.getMetadata(COLLECTION_META_KEY, target);
    
    const { collection, innerComponent } = {...options};
    const appended = {
      ...existing,
      [key]: {
        collection: { by: collectionBy, ...collection },
        innerComponent: { type: innerItemType, by: itemBy, ...innerComponent },
      },
    };
    Reflect.defineMetadata(COLLECTION_META_KEY, appended, target);
  };
}
