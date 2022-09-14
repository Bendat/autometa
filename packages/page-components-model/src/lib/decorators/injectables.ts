import { Injectable } from '@jest-automation/shared-utilities';
import { ThenableWebDriver } from 'selenium-webdriver';
import { constructor } from 'tsyringe/dist/typings/types';

const PageObjectDecorator = (driver?: ThenableWebDriver) => {
  return (ctr: constructor<unknown>) => {
    const cls = constructionInterceptor(ctr, driver);
    return Injectable()(cls as unknown as constructor<unknown>);
  };
};

export const InjectableComponent: <T>() => (target: constructor<T>) => void = Injectable;
export const InjectablePage = PageObjectDecorator;

function constructionInterceptor(
  ctr: constructor<unknown>,
  driver: ThenableWebDriver
) {
  /**
   * Replace the constructor of the provided class with a custom proxy
   * which can intercept object instantiation and provide its own logic
   */
  const original = ctr;

  function construct(constructor: constructor<unknown>, ...args: unknown[]) {
    const proxyConstructor = function () {
      if (driver) {
        this.driver = driver;
      }
      return constructor.apply(this, args);
    } as unknown as constructor<unknown>;

    proxyConstructor.prototype = constructor.prototype;
    return new proxyConstructor();
  }
  const cls = function (...args: unknown[]) {
    return construct(original, args);
  };

  cls.prototype = original.prototype;
  return cls;
}
