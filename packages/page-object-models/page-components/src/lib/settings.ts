import { ComponentSettings } from './components/component-settings';
import { InjectionSettings } from './injection.ts/injection-settings';
/**
 * Centralized settings object. Provides functions to configure
 * how page objects and components behave.
 *
 * Components can be configured to log actions or automatically
 * wait for a condition to be true before proceeding.
 *
 * The dependency injection container can also be configured.
 */
export const POM = {
  settings: {
    ...InjectionSettings,
    ...ComponentSettings,
  },
};
