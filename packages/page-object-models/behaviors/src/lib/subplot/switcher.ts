import { WebBrowser } from '@autometa/page-components';

export class Switcher {
  constructor(
    private switchStrategy: (
      browser: WebBrowser,
      windowHandle?: string
    ) => Promise<void>
  ) {}

  execute = (browser: WebBrowser, windowName: string) => {
    return this.switchStrategy(browser, windowName);
  };
}
