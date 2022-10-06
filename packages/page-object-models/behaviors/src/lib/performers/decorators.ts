import { Website } from '@autometa/page-components';
import { Builder } from 'selenium-webdriver';
import { constructor } from 'tsyringe/dist/typings/types';
import { URL } from 'url';
import { Plans } from '../plans';

export function roleKey(propertyKey: string | symbol) {
  return `community:meta:user:role:${String(propertyKey)}`;
}
export function browsesKey(propertyKey: string | symbol) {
  return `community:meta:user:browses:${String(propertyKey)}`;
}
export function plansKey(propertyKey: string | symbol) {
  return `community:meta:user:plans:${String(propertyKey)}`;
}
export const defaultDriverKey = 'community:meta:driver:default';
export const driverNamesKey = 'community:meta:driver:named';
export const namedDriverKey = (name: string) => `community:meta:driver:${name}`;
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
export const nameKey = `community:meta:users:names`;
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

export function plans<T extends Plans>(plans: constructor<T>): PropertyDecorator {
  return (target, key): void => {
    const existing = Reflect.getMetadata(plansKey(key), target.constructor);
    if(existing){
      throw new Error(`User ${target.constructor.name} can only have 1 plan attached. Has ${existing}, attempting to attach ${plans}`)
    }
    Reflect.defineMetadata(plansKey(key), plans, target.constructor);
  };
}