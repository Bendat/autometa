import { Class } from '@autometa/shared-utilities';
import { container, DependencyContainer, Lifecycle } from 'tsyringe';

import { Injectable } from './injectable';

export type DiContainerWithDefaults = {
  container: DependencyContainer;
  providers: Provider[];
};

export function di(): DiContainerWithDefaults {
  const child = container.createChildContainer();
  child.registerInstance('Container', child);
  constructProviders(child);
  const groups = constructGroups(child);
  return { container: child, providers: [groups] };
}

interface DependencyGroup {
  [name: string]: Class<unknown>;
}

@Injectable()
export class Provider {
  [name: string]: unknown;
}

const providerGroups: DependencyGroup[] = [];
const providerClasses: Class<unknown>[] = [];

export function registerProvider(
  blueprints: DependencyGroup,
  ...providers: Class<unknown>[]
) {
  providerGroups.push(blueprints);
  providers.map((it) => providerClasses.push(it));
}

function constructProviders(container: DependencyContainer) {
  for (const providerClass of providerClasses) {
    register<unknown>(container, providerClass);
  }
}

function constructGroups(container: DependencyContainer) {
  const obj = new Provider();
  for (const providerClass of providerGroups) {
    for (const property in providerClass) {
      const group = providerClass[property];
      register(container, group);
    }
  }

  for (const providerClass of providerGroups) {
    for (const property in providerClass) {
      const group = providerClass[property];
      obj[property] = container.resolve(group) as never;
    }
  }
  return obj;
}

export const defaultContainerScope = { lifecycle: Lifecycle.ContainerScoped };

function register<T>(container: DependencyContainer, provider: Class<T>) {
  container.register<T>(provider, provider, defaultContainerScope);
}
