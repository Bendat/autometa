import { Component } from '../meta-types';
import { WebElement } from 'selenium-webdriver';
import { EventEmitter } from 'stream';
import { constructor } from 'tsyringe/dist/typings/types';

export class ElementArray<T extends Component> implements Iterable<T> {
  #cachedElements: T[] = [];

  #factory: (loadedElement: WebElement, index: number) => T;
  #find: () => Promise<WebElement[]>;
  #events: () => EventEmitter;
  #type: () => constructor<T>;

  constructor(
    type: () => constructor<T>,
    find: () => Promise<WebElement[]>,
    factory: (loadedElement: WebElement, index: number) => T,
    events: () => EventEmitter
  ) {
    this.#type = type;
    this.#find = find;
    this.#factory = factory;
    this.#events = events;
  }

  get hasCachedItems() {
    return this.#cachedElements.length > 0;
  }

  get elements(): Promise<T[]> {
    return this.#getElements(false);
  }

  get length() {
    return this.elements.then((it: Array<T>) => it.length);
  }

  get lengthSnapshot() {
    return this.#cachedElements.length;
  }

  toStringAsync = async () => {
    return `[${await Promise.all(
      this.#cachedElements.map((it) => it.toStringAsync())
    )}]`;
  };

  clear = () => {
    this.#cachedElements = [];
  };

  load = async () => {
    await this.elements;
    return this;
  };

  /**
   * Clears the currently set values and searches for them again.
   * @returns this
   */
  reload = async () => {
    await this.#getElements(true);
    return this;
  };

  /**
   * Components are cached in DOM order and can accessed by index using
   * this method.
   * @param type The class (not object/instance) to construct when located.
   * @param index The index to find the Component at. Negative numbers will index the results backwards.
   * @returns The Component if it exists.
   */
  at = async (index: number, onElement?: (component: T) => Promise<void>) => {
    const elements = await this.elements;
    const result = elements.at(index);
    if (onElement) {
      await onElement(result);
    }
    return result;
  };

  /**
   * Loops through all the Components of a given type
   * and passes them to a callback for use. They are
   * passed in DOM order and acted on in sequence.
   * @param type The class (not object/instance) to construct
   * @param action The action to perform on each Component found
   * @returns
   */
  forEach = async (action: (component: T, index: number) => Promise<void>) => {
    let index = 0;
    for (const element of await this.elements) {
      await action(element, index++);
    }
  };

  includes = async <TExpectedType>(
    contents: TExpectedType | TExpectedType[],
    mapper: (component: T) => Promise<TExpectedType>
  ) => {
    const mapped: TExpectedType[] = [];
    for (const component of await this.elements) {
      mapped.push(await mapper(component));
    }
    if (Array.isArray(contents)) {
      return mapped.every((it) => contents.includes(it));
    }
    return mapped.includes(contents);
  };

  /**
   * Loops through all the Components of a given type
   * and passes them to a callback for use, and mapping the sequence to the return type. They are
   * passed in DOM order and acted on in sequence.
   * @param type The class (not object/instance) to construct
   * @param action The action to perform on each Component found
   * @returns An array of values which have been mapped from a component
   */
  map = async <K>(action: (component: T, index: number) => Promise<K>) => {
    const mapped: K[] = [];
    let index = 0;

    for (const element of await this.elements) {
      mapped.push(await action(element, index++));
    }
    return mapped;
  };

  /**
   * Loops through all the Components of a given type
   * and passes them to a callback for use, and mapping the sequence to the return type, flattening them if they are arrays.
   * They are passed in DOM order and acted on in sequence.
   * @param type The class (not object/instance) to construct
   * @param action The action to perform on each Component found
   * @returns An array of values which have been mapped and flattened from a component
   */
  flatMap = async (
    action: <K>(component: T, index: number) => Promise<K[]>
  ) => {
    const mapped = [];
    let index = 0;

    for (const element of await this.elements) {
      mapped.push(await action(element, index++));
    }

    return mapped.flatMap((it) => it);
  };

  public *[Symbol.iterator](): Iterator<T> {
    let idx = 0;
    for (const component of this.#cachedElements) {
      if (idx++ >= this.#cachedElements.length) {
        break;
      }
      yield component;
    }
  }
  #subscribedEvent = false;
  #getElements = async (invalidateCache: boolean) => {
    if (!this.#subscribedEvent) {
      this.#events().on('ForceRefreshAll', () => {
        console.debug(`Marking '${this.#type().name}' array as stale`);
        this.#cachedElements = [];
      });
      this.#subscribedEvent = true;
    }
    if (invalidateCache) {
      this.#cachedElements = [];
    }
    if (this.#cachedElements.length > 0) {
      return this.#cachedElements;
    }
    const found = await this.#find();
    const asComponents = found.map((it, idx) => this.#factory(it, idx));
    this.#cachedElements = asComponents;
    return asComponents;
  };
}
