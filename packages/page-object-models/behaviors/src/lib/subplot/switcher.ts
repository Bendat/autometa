import { Browser } from "@autometa/page-components";

export class Switcher {
  constructor(
    private switchStrategy: (
      browser: Browser,
      windowHandle?: string
    ) => Promise<void>
  ) {}

  execute = (browser: Browser, windowName: string) => {
    return this.switchStrategy(browser, windowName);
  };
}
