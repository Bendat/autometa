import { By, until } from 'selenium-webdriver';
import { constructor } from 'tsyringe/dist/typings/types';
import { Component } from '../../meta-types/component';
import { ConstructionOptions } from '../../types';
import { ElementArray } from '../lazy-element-array';

export abstract class Collection<T extends Component> extends Component {
  protected cachedComponents!: ElementArray<T>;

  /**
   * The Type of the child Components to construct
   */
  protected abstract childType: constructor<T>;
  /**
   * The locator for child Components.
   */
  protected abstract childElementLocator: By;
  /**
   * Name to display on the {@see PageObject.breadcrumbs} tag
   * for located Components. Will be appended with an index
   * representing the DOM order of the Component
   *
   * e.g. `MyComponent[0]`
   *
   * This value will also be set as the DOM name of the component
   *
   */
  protected childIdentifierString: string | undefined = undefined;

  get values(): Promise<Collection<T>> {
    return this.load().then(() => this);
  }

  get length() {
    return this.cachedComponents.length;
  }

  load = async () => {
    const components = this.#findComponents();
    await components.reload();
    return this;
  };

  reload = async () => {
    return this.cachedComponents.reload();
  };

  /**
   * Collects all webElements which match the provided Locator,
   * constructs them into the Component associated with this collection, and caches
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
  protected get entries() {
    return this.#findComponents();
  }

  *[Symbol.iterator](): Iterator<T> {
    for (const component of this.cachedComponents) {
      yield component;
    }
  }

  /**
   * Components are cached in DOM order and can accessed by index using
   * this method.
   * @param type The class (not object/instance) to construct when located.
   * @param index The index to find the Component at. Negative numbers will index the results backwards.
   * @returns The Component if it exists.
   */
  at = async (
    byOrIndex: By | number | string,
    onElement: (component: T) => Promise<void> = async () => undefined
  ) => {
    await this.load();
    const element: T | undefined = await this.#findSingleComponent(
      byOrIndex,
      onElement
    );
    if (element) {
      await onElement(element);
      return element;
    }
    return undefined;
  };

  forEach = (action: (component: T, index: number) => Promise<void>) => {
    return this.entries.forEach(action);
  };

  includes = async <TExpectedType>(
    contents: TExpectedType | TExpectedType[],
    mapper: (component: T) => Promise<TExpectedType>
  ) => {
    return this.entries.includes(contents, mapper);
  };

  map = <K>(action: (component: T, index: number) => Promise<K>) => {
    return this.entries.map(action);
  };

  flatMap = (action: <K>(component: T, index: number) => Promise<K[]>) => {
    return this.entries.flatMap(action);
  };
  /**
   * Returns the first element inside this collection which
   * matches the provided locator.
   *
   * @param by The locator to match elements against
   * @param type The class to instantiate as a Component
   * @returns A Component of the found element.
   */
  by = <T extends Component>(by: By, type: constructor<T>) => {
    return this.find({ type, by }, this.childIdentifierString ?? '');
  };

  async #findSingleComponent(
    byOrIndex: number | By | string,
    onElement: (component: T) => Promise<void>
  ) {
    if (byOrIndex instanceof By) {
      const element = await this.findByLocator(byOrIndex);
      return element;
    }
    if (typeof byOrIndex === 'string') {
      return await this.findByTextEquals(byOrIndex);
    }
    if (
      this.cachedComponents &&
      this.cachedComponents.lengthSnapshot < byOrIndex
    ) {
      return this.cachedComponents.at(byOrIndex);
    }
    return await this.entries.at(byOrIndex, onElement);
  }

  private async findByLocator(byOrIndex: By) {
    const element = await this.find(
      { type: this.childType, by: byOrIndex },
      `${this.childType.name}[${byOrIndex}]`
    );
    this.driver.wait(until.elementIsVisible(element.element));
    return element;
  }

  private async findByTextEquals(byOrIndex: string) {
    return await this.find(
      {
        type: this.childType,
        by: By.xpath(`//*[text()='${byOrIndex}')]`),
      },

      `${this.childType.name}[${byOrIndex}]`
    );
  }

  #findComponents() {
    if (!this.cachedComponents) {
      const options: ConstructionOptions<T> = {
        type: this.childType,
        by: this.childElementLocator,
      };
      this.cachedComponents = this.findAll(options);
    }
    return this.cachedComponents;
  }
}

export class InjectedCollection<T extends Component> extends Collection<T> {
  protected childType!: constructor<T>;
  protected childElementLocator!: By;
}
