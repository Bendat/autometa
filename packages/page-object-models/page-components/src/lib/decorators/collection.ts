import { By } from 'selenium-webdriver';
import { Component } from '../';
import { WaitOptions, ConstructionOptions } from '../types';
import { COLLECTION_META_KEY } from './component';
import { constructor } from './injectables';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any, key): void => {
    const existing = Reflect.getMetadata(COLLECTION_META_KEY, target);

    const { collection, innerComponent } = { ...options };
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
