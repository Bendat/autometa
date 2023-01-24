import { WebDriver } from 'selenium-webdriver';
import { injectable } from 'tsyringe';
export type constructor<T> = {
  new (...args: unknown[]): T;
};
const PageObjectDecorator = (driver?: WebDriver) => {
  return (ctr: constructor<unknown>) => {
    const cls = constructionInterceptor(ctr, driver);
    return injectable()(cls as unknown as constructor<unknown>);
  };
};

export const InjectableComponent: <T>() => (target: constructor<T>) => void =
  injectable;
export const InjectablePage = PageObjectDecorator;

function constructionInterceptor(
  ctr: constructor<unknown>,
  driver?: WebDriver
) {
  /**
   * Replace the constructor of the provided class with a custom proxy
   * which can intercept object instantiation and provide its own logic
   */
  const original = ctr;

  function construct(constructor: constructor<unknown>, ...args: unknown[]) {
    const proxyConstructor = function () {
      if (driver) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.driver = driver;
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
