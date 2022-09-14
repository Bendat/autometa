import { By } from 'selenium-webdriver';
import { constructor } from 'tsyringe/dist/typings/types';
import { Component } from '../../meta-types/component';
import { ElementArray } from '../lazy-element-array';

/**
 * A generic container type Component. Useful
 * for dynamic, non deterministic content.
 *
 * Can search for and construct Components based
 * on provided conditions
 */
export class Container extends Component {
  protected cachedElements: { [key: string]: ElementArray<Component> } = {};
 
  /**
   * Find and return a descendant of this Container,
   * constructing it into the desired Component type
   * @param ofType The class (not class instance) to be constructed once found
   * @param by The locator to find the element by
   * @returns A promise of the constructed object if found.
   */
  async select<T extends Component>(
    ofType: constructor<T>,
    by: By
  ): Promise<T> {
    return this.find({ by, type: ofType });
  }

  /**
   * Collects all webElements which match the provided Locator,
   * constructs them into the provided type {@see ofType}, and caches
   * the result.
   *
   * Can only return one kind of "shape" at once.
   *
   * @param ofType The class (not instance/object) to be constructed
   * @param by The locator to find elements with
   * @param invalidateCache If true, cached elements from prior searches will be purged and
   *                        a new list generated.
   * @returns An ElementArray of the matching elements.
   */
  async get<T extends Component>(
    ofType: constructor<T>,
    by: By,
    invalidateCache?: boolean
  ) {
    if (invalidateCache) {
      Object.keys(this.cachedElements).map(
        (key) => delete this.cachedElements[key]
      );
    }
    if (this.cachedElements[ofType.name]) {
      return this.cachedElements[ofType.name];
    }
    if (!by) {
      throw new Error(
        `No 'By' locator was provided, and no cache was found for '${ofType.name}'. If you're using forEach, map or flatMap for the first time for a given type, you must either provide a By locator or call entries()`
      );
    }
    // this.cachedElements[ofType.name] = new ElementArray<T>(() =>
    //   this._findAll<T>({ by, type: ofType })
    // );
    return this.cachedElements[ofType.name];
  }

  /**
   * Components are cached in DOM order and can accessed by index using
   * this method.
   * @param type The class (not object/instance) to construct when located.
   * @param index The index to find the Component at. Negative numbers will index the results backwards.
   * @param by The locator to find Components by. Optional if entries have already been cached, but mandatory if this is the first access.
   * @returns The Component if it exists.
   */
  at = async <T extends Component>(
    type: constructor<T>,
    index: number,
    by?: By
  ) => (await this.get(type, by)).at(index);

  /**
   * Loops through all the Components of a given type
   * and passes them to a callback for use. They are
   * passed in DOM order and acted on in sequence.
   * @param type The class (not object/instance) to construct
   * @param action The action to perform on each Component found
   * @param by The locator to find Components by. Optional if entries have already been cached, but mandatory if this is the first access.
   *
   * @returns
   */
  forEach = async <T extends Component>(
    type: constructor<T>,
    action: (component: T) => Promise<void>,
    by?: By
  ) => (await this.get(type, by)).forEach(action);

  /**
   * Loops through all the Components of a given type
   * and passes them to a callback for use, and mapping the sequence to the return type. They are
   * passed in DOM order and acted on in sequence.
   * @param type The class (not object/instance) to construct
   * @param action The action to perform on each Component found
   * @param by The locator to find Components by. Optional if entries have already been cached, but mandatory if this is the first access.
   * @returns An array of values which have been mapped from a component
   */
  map = async <T extends Component>(
    type: constructor<T>,
    action: <K>(component: T, index: number) => Promise<K>,
    by?: By
  ) => (await this.get(type, by)).map(action);

  /**
   * Loops through all the Components of a given type
   * and passes them to a callback for use, and mapping the sequence to the return type, flattening them if they are arrays.
   * They are passed in DOM order and acted on in sequence.
   * @param type The class (not object/instance) to construct
   * @param action The action to perform on each Component found
   * @param by The locator to find Components by. Optional if entries have already been cached, but mandatory if this is the first access.
   * @returns An array of values which have been mapped and flattened from a component
   */
  flatMap = async <T extends Component>(
    type: constructor<T>,
    action: <K>(component: T, index: number) => Promise<K>,
    by?: By
  ) => (await this.get(type, by)).flatMap(action);
}
