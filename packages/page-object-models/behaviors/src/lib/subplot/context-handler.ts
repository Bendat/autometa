import { Browser } from "@autometa/page-components";
import { URL } from "url";
import { User, UserDriver } from "..";

export class ContextHandler {
  constructor(
    private windowHandle: (
      type: 'tab' | 'window' | 'either',
      driver: Browser,
      user: UserDriver,
      windowName: string,
      url?: string | URL
    ) => Promise<string>
  ) {}
  execute(
    user: UserDriver | User,
    driver: Browser,
    windowName: string,
    type: 'tab' | 'window' | 'either'
  ) {
    return this.windowHandle(type, driver, user as UserDriver, windowName);
  }
}

