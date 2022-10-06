import { Switcher } from './switcher';

export const ClosesTo = new Switcher(async (browser, windowHandle) => {
  await browser.close();
  await browser.window.switchTo.handle(windowHandle);
});

export const MinimizesTo = new Switcher(async (browser, handle) => {
  await browser.driver.manage().window().minimize();
  await browser.window.switchTo.handle(handle);
});

export const SwitchesTo = new Switcher(async (browser, handle) => {
  await browser.window.switchTo.handle(handle);
});

export const Idle = new Switcher(async () => undefined);
