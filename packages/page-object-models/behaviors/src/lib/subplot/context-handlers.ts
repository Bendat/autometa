import { ContextHandler } from './context-handler';
import { Switcher } from './switcher';
import { WindowContext } from './window-context';

export const Tab = (name: string, handler: ContextHandler) =>
  new WindowContext('tab', name, handler);

export const Window = (name: string, handler: ContextHandler) =>
  new WindowContext('tab', name, handler);

export const Which = (then: Switcher, name: string) =>
  new ContextHandler(async (_, browser) => {
    const context = browser.windows[name];
    if (!context) {
      throw new Error(
        `Cannot switch to ${name}. No window or tab has been marked with this name. To go back to original launched tab use 'initial'`
      );
    }
    await then.execute(browser, context.handle);
    return context.handle;
  });

export const New = new ContextHandler(
  async (type, browser, user, windowName) => {
    if(browser.windows[windowName]){
      throw new Error(`Window or tab with name ${windowName} already exists, cannot create again.`)
    }
    return  browser.window.open(
      windowName,
      type as 'tab' | 'window',
      user.url,
      user
    );
  }
);

export const Return = new ContextHandler(
   (_, browser, __, windowName) =>
    browser.window.switchTo.named(windowName)
);
