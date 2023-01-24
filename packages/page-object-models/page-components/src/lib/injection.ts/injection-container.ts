import { DependencyContainer } from 'tsyringe/dist/typings/types';
import { DI_BASE_CONTAINER } from './default-di-container';

class InjectionContainerWrapper {
  #container = DI_BASE_CONTAINER;
  #hasBeenAccessed = false;

  get container() {
    this.#hasBeenAccessed = true;
    return this.#container;
  }

  set container(value: DependencyContainer) {
    if (this.#hasBeenAccessed) {
      throw Error(
        'Cannot set a new Injection Container after the previous has been used. Perhaps you need to configure this earlier in script execution?'
      );
    }
    this.#container = value;
  }
}

export const InjectionContainer = new InjectionContainerWrapper();
