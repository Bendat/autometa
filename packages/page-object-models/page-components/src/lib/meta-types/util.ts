import { By, WebDriver, WebElement } from 'selenium-webdriver';
import { Component } from './component';
import {
  COLLECTION_META_KEY,
  COMPONENT_META_KEY,
} from '../decorators/component';
import { PAGE_META_KEY } from '../decorators/page';
import { DI_BASE_CONTAINER } from '../injection.ts/default-di-container';
import { PageObject } from './page-object';
import { ConstructionOptions, WaitOptions } from '../types';
import { Until } from '../until/until';
import { WebPage } from './web-page';
import { constructor } from 'tsyringe/dist/typings/types';
import { InjectionContainer } from '../injection.ts';
import { Collection, InjectedCollection } from '../components';
import { CollectionDecoratorAdditionalConfig } from '../decorators/collection';
import { EventEmitter } from 'stream';
type ComponentMetaData = ConstructionOptions<Component>;

export function applyComponentDecorators(target: PageObject) {
  const existing: Record<string, ComponentMetaData> = Reflect.getMetadata(
    COMPONENT_META_KEY,
    target
  );
  throwIfWrongType(target);
  for (const propertyKey in existing) {
    const match = existing[propertyKey];
    if (!match) {
      continue;
    }

    constructComponentFromMetadata(match, target, propertyKey);
  }

  const collections: Record<string, CollectionDecoratorAdditionalConfig> =
    Reflect.getMetadata(COLLECTION_META_KEY, target);

  for (const propertyKey in collections) {
    const match = collections[propertyKey];
    if (!match) {
      continue;
    }

    constructCollectionFromMetadata(match, target, propertyKey);
  }
}

export function applyPageDecorators<T extends PageObject>(target: T) {
  const existing: Record<
    string,
    ConstructionOptions<WebPage>
  > = Reflect.getMetadata(PAGE_META_KEY, target);
  throwIfWrongType(target);
  for (const propertyKey in existing) {
    const match = existing[propertyKey];
    if (!match || match instanceof Component) {
      continue;
    }
    buildAndAssignPage(target, propertyKey);
  }
}

function buildAndAssignPage(target: PageObject, propertyKey: string) {
  const type: constructor<Component> = Reflect.getMetadata(
    'design:type',
    target,
    propertyKey
  );
  const instance = DI_BASE_CONTAINER.resolve(type);
  assignDriver(instance, target);
  assignSearcher(instance, target);
  assignInstanceToParent(instance, target, propertyKey);
  assignParent(instance, target);
  assignPomName(instance, propertyKey);
  applyComponentDecorators(instance);
}

export function assignPomName(target: PageObject, propertyKey?: string) {
  if (!propertyKey) {
    return;
  }
  let name = propertyKey;
  Reflect.deleteProperty(target, '_pomName');
  Reflect.defineProperty(target, '_pomName', {
    get: () => name,
    set: (value: string) => (name = value),
  });
  if (target instanceof Component) {
    Reflect.deleteProperty(target.element, '_pomName');
    Reflect.defineProperty(target.element, '_pomName', {
      get: () => name,
      set: (value: string) => (name = value),
    });
  }
}
export function constructDynamicComponentFromFind<T extends Component>(
  match: ConstructionOptions<T>,
  target: PageObject,
  loadedElement: WebElement,
  name: string
) {
  const { type } = match;
  const instance = DI_BASE_CONTAINER.resolve(type);
  assignComponent(instance, target, match as WaitOptions);
  assignPomName(instance, name);
  instance.element.elementLoaded = loadedElement;
  return instance;
}

export function constructComponentFromMetadata(
  match: ConstructionOptions<Component>,
  target: PageObject,
  propertyKey: string
) {
  const type: constructor<Component> = Reflect.getMetadata(
    'design:type',
    target,
    propertyKey
  );
  // const { type } = match;
  const { container } = InjectionContainer;
  if (!container.isRegistered(type)) {
    container.register(type, type);
  }
  const instance = container.resolve(type);

  assignComponent(instance, target, match as WaitOptions, propertyKey);
  return instance;
}

export function constructCollectionFromMetadata(
  { collection, innerComponent }: CollectionDecoratorAdditionalConfig,
  target: PageObject,
  propertyKey?: string
) {
  const type: constructor<Collection<Component>> = InjectedCollection;
  const { container } = InjectionContainer;
  if (!container.isRegistered(type)) {
    container.register(type, type);
  }
  const instance = container.resolve(type);
  const { type: innerType, by: innerBy } = innerComponent;
  assignCollectionChildLocators(instance, innerType, innerBy);
  assignComponent(instance, target, collection as WaitOptions, propertyKey);
  return instance;
}

function assignCollectionChildLocators(
  instance: Collection<Component>,
  innerType: constructor<Component>,
  innerBy?: By
) {
  Reflect.deleteProperty(instance, 'childType');
  Reflect.defineProperty(instance, 'childType', {
    get: () => {
      return innerType;
    },
  });
  Reflect.deleteProperty(instance, 'childElementLocator');
  Reflect.defineProperty(instance, 'childElementLocator', {
    get: () => {
      return innerBy;
    },
  });
}

export function assignComponent(
  instance: Component,
  target: PageObject,
  options: WaitOptions,
  propertyKey?: string
) {
  if (!(instance instanceof Component)) {
    const inst = instance as { constructor: { name: string } };
    throw new Error(
      `Trying to create a component ${inst.constructor.name} which does not inherit from '${Component.name}'`
    );
  }
  const { by, until, timeout } = options;
  assignPomName(instance, propertyKey);
  assignDriver(instance, target);
  assignSearcher(instance, target);
  assignWaitObject(instance, until, by, timeout);
  assignInstanceToParent(instance, target, propertyKey);
  assignParent(instance, target);
  // recursively construct child components
  applyComponentDecorators(instance);
}

function throwIfWrongType(target: PageObject) {
  if (!(target instanceof PageObject)) {
    throw new Error(
      '@component decorator target must be a class which inherits "PageObject"'
    );
  }
}

export function assignInstanceToParent(
  instance: PageObject,
  target: PageObject,
  propertyKey?: string
) {
  if (!propertyKey) {
    return;
  }
  Reflect.deleteProperty(target, propertyKey);
  Reflect.defineProperty(target, propertyKey, {
    get: () => instance,
  });
}

export function assignWaitObject(
  instance: Component,
  until: Until,
  by: By,
  timeout: number
) {
  const { until: defaultUntil } = Reflect.get(instance, '_waitOptions');
  const actualUntil: Until = until ?? defaultUntil;
  const waitOptions = { by, timeout, until: actualUntil };
  Reflect.deleteProperty(instance, '_waitOptions');
  Reflect.defineProperty(instance, '_waitOptions', {
    get: () => waitOptions,
  });
}

export function assignDriver(instance: PageObject, target: PageObject) {
  Reflect.deleteProperty(instance, '_driver');
  Reflect.defineProperty(instance, '_driver', {
    get: () => (target as unknown as { driver: WebDriver }).driver,
  });

  if (instance instanceof Component) {
    Reflect.deleteProperty(instance.element, '#driver');
    Reflect.defineProperty(instance.element, '#driver', {
      get: () => (target as unknown as { driver: WebDriver }).driver,
    });
  }
}

export function assignSearcher(instance: PageObject, target: PageObject) {
  Reflect.deleteProperty(instance, '_searcher');
  if (target instanceof Component) {
    Reflect.defineProperty(instance, '_searcher', {
      get: () => target.element,
    });
  } else {
    Reflect.defineProperty(instance, '_searcher', {
      get: () => (target as unknown as { driver: WebDriver }).driver,
    });
  }
}
export function assignParent(instance: PageObject, target: PageObject) {
  Reflect.deleteProperty(instance, '_parent');
  Reflect.defineProperty(instance, '_parent', {
    get: () => target,
  });
  Reflect.deleteProperty(instance, '_eventEmitter');
  Reflect.defineProperty(instance, '_eventEmitter', {
    get: () => (target as unknown as { events: EventEmitter }).events,
  });
  if (instance instanceof Component) {
    (instance as unknown as { events: EventEmitter }).events.on(
      'ForceRefreshAll',
      () => {
        instance.element.markStale();
      }
    );
  }
}

export function getName(type: { constructor: { name: string } }) {
  return type.constructor.name;
}
