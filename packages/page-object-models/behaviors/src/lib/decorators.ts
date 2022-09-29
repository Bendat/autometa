import { Website } from '@autometa/page-components';
import { Builder } from 'selenium-webdriver';
import { URL } from 'url';

export function roleKey(propertyKey: string | symbol) {
  return `cast:meta:user:role:${String(propertyKey)}`;
}
export function browsesKey(propertyKey: string | symbol) {
  return `cast:meta:user:browses:${String(propertyKey)}`;
}
export const defaultDriverKey = 'cast:meta:driver:default';
export const driverNamesKey = 'cast:meta:driver:named';
export const namedDriverKey = (name: string) => `cast:meta:driver:${name}`;
// const n = new Builder().forBrowser()
export function driver(builder: Builder, name?: string): ClassDecorator {
  return (target): void => {
    if (!name) {
      Reflect.defineMetadata(defaultDriverKey, builder, target);
      return;
    }
    const names = Reflect.getMetadata(driverNamesKey, target) ?? [];
    names.push(name);
    Reflect.deleteMetadata(driverNamesKey, target);
    Reflect.defineMetadata(driverNamesKey, names, target);
    Reflect.defineMetadata(namedDriverKey(name), builder, target);
  };
}
export const nameKey = `cast:meta:users:names`;
export function role(title: string): PropertyDecorator {
  return (target, key): void => {
    let names: Set<unknown> = Reflect.getMetadata(nameKey, target.constructor);
    if (!names) {
      names = new Set();
      Reflect.defineMetadata(nameKey, names, target.constructor);
    }
    names.add(key);
    const existing = Reflect.getMetadata(roleKey(key), target.constructor);
    const appended = {
      ...existing,
      [key]: title,
    };
    Reflect.deleteMetadata(roleKey(key), target.constructor);
    Reflect.defineMetadata(roleKey(key), appended, target.constructor);
  };
}
export type WebsiteFactory = () => Website;

export function browses(site: string | URL): PropertyDecorator {
  return (target, key): void => {
    const existing = Reflect.getMetadata(browsesKey(key), target.constructor);
    const appended = {
      ...existing,
      [key]: site,
    };
    Reflect.defineMetadata(browsesKey(key), appended, target.constructor);
  };
}
