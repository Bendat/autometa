import { WebBrowser } from '@autometa/page-components';
import { URL } from 'url';
import { Participant } from '../test-users/participant';
// import { User, UserDriver } from '..';

export abstract class SubplotWindow {
  constructor(
    private type: 'tab' | 'window' | 'either',
    private browser: WebBrowser,
    private user: Participant,
    private windowName: string,
    private url?: string | URL
  ) {}
  // constructor(
  //   // private windowHandle: (
  //   //   type: 'tab' | 'window' | 'either',
  //   //   browser: Browser,
  //   //   user: UserDriver,
  //   //   windowName: string,
  //   //   url?: string | URL
  //   // ) => Promise<string>
  // ) {}
  execute() {
    return this.windowHandle();
  }

  abstract windowHandle(): Promise<string>;
}
