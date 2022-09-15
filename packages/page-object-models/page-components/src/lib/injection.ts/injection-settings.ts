import { DependencyContainer } from 'tsyringe/dist/typings/types';
import { InjectionContainer } from './injection-container';

export const InjectionSettings = {
  setDiContainer: (container: DependencyContainer) => {
    InjectionContainer.container = container;
  },
};
