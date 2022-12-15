import { Browser } from '@autometa/page-components';
import { URL } from 'url';
import { User, UserDriver } from '..';

export abstract class WindowTypeContext {
  constructor(
    private type: 'tab' | 'window' | 'either',
    private browser: Browser,
    private user: UserDriver,
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
  execute(
  ) {
    return this.windowHandle( );
  }

  abstract windowHandle(
  ): Promise<string>;
}
