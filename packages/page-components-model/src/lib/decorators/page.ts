import { constructor } from 'tsyringe/dist/typings/types';
import { DI_BASE_CONTAINER } from '../injection.ts/default-di-container';
import { WebPage } from '../meta-types/web-page';
export const PAGE_META_KEY = 'properties:decorated:page';

export function page<T extends WebPage>(
  type: constructor<T>
): PropertyDecorator {
  if (!DI_BASE_CONTAINER.isRegistered(type)) {
    DI_BASE_CONTAINER.register(type, type);
  }
  DI_BASE_CONTAINER.register(type, type);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any, key): void => {
    const existing = Reflect.getMetadata(PAGE_META_KEY, target);
    const appended = {
      ...existing,
      [key]: { type },
    };
    Reflect.defineMetadata(PAGE_META_KEY, appended, target);
  };
}
