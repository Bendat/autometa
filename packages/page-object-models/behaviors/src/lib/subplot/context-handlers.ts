// import { Browser } from '@autometa/page-components';
// import { URL } from 'url';
// import { UserDriver } from '../performers';
// import { NoPlans } from '../plans';
// import { WindowTypeContext } from './context-handler';
// import { Switcher } from './switcher';
// import { WindowStartContext } from './window-context';
// class Tab2 extends WindowStartContext {
//   constructor(
//     public readonly name: string,
//     public readonly handler: WindowTypeContext
//   ) {
//     super('tab', name, handler);
//   }
// }
// class Window2 extends WindowStartContext {
//   constructor(
//     public readonly name: string,
//     public readonly handler: WindowTypeContext
//   ) {
//     super('window', name, handler);
//   }
// }
// export class WindowActivationEvent {
//   constructor(
//     private activate: WindowTypeContext,
//     private view: WindowStartContext,
//     private location: string
//   ) {}
// }

// export class On extends WindowActivationEvent {}
// // export const On = (activate: WindowTypeContext, view: WindowStartContext, location: string)=>{

// // }

// export class Tab extends WindowStartContext {
//   constructor(name: string, handler: WindowTypeContext) {
//     super('tab', name, handler);
//   }
// }

// export class Window extends WindowStartContext {
//   constructor(name: string, handler: WindowTypeContext) {
//     super('window', name, handler);
//   }
// }
// export class Which extends WindowTypeContext {
//   async windowHandle(
//   ): Promise<string> {
//     const context = this.driver.windows[windowName];
//     if (!context) {
//       throw new Error(
//         `Cannot switch to ${windowName}. No window or tab has been marked with this name. To go back to original launched tab use 'initial'`
//       );
//     }
//     await user.execute(browser, context.handle);
//     return context.handle;
//   }
//   does(
//     type: 'tab' | 'window' | 'either',
//     driver: Browser,
//     user: UserDriver<NoPlans>,
//     windowName: string,
//     url?: string | URL
//   ) {
//     return new class {

//     }
//   }
//   constructor(private then: Switcher, name: string) {
//     super(async (_, browser) => {
//       const context = browser.windows[name];
//       if (!context) {
//         throw new Error(
//           `Cannot switch to ${name}. No window or tab has been marked with this name. To go back to original launched tab use 'initial'`
//         );
//       }
//       await then.execute(browser, context.handle);
//       return context.handle;
//     });
//   }

// }

// // export const Which = (then: Switcher, name: string) =>
// //   new WindowTypeContext(async (_, browser) => {
// //     const context = browser.windows[name];
// //     if (!context) {
// //       throw new Error(
// //         `Cannot switch to ${name}. No window or tab has been marked with this name. To go back to original launched tab use 'initial'`
// //       );
// //     }
// //     await then.execute(browser, context.handle);
// //     return context.handle;
// //   });

// export class New extends WindowTypeContext {
//   override windowHandle(
//     type: 'tab' | 'window' | 'either',
//     driver: Browser,
//     user: UserDriver<NoPlans>,
//     windowName: string
//   ): Promise<string> {
//     if (driver.windows[windowName]) {
//       throw new Error(
//         `Window or tab with name ${windowName} already exists, cannot create again.`
//       );
//     }
//     return driver.window.open(
//       windowName,
//       type as 'tab' | 'window',
//       user.url,
//       user
//     );
//   }
// }

// // export const New = new WindowTypeContext(
// //   async (type, browser, user, windowName) => {
// //     if (browser.windows[windowName]) {
// //       throw new Error(
// //         `Window or tab with name ${windowName} already exists, cannot create again.`
// //       );
// //     }
// //     return browser.window.open(
// //       windowName,
// //       type as 'tab'   | 'window',
// //       user.url,
// //       user
// //     );
// //   }
// // );

// // export const Return = new WindowTypeContext((_, browser, __, windowName) =>
// //   browser.window.switchTo.named(windowName)
// // );

// export class Return extends WindowTypeContext {
//   // constructor(windowName: string) {
//   //   super((_, browser) =>
//   //     browser.window.switchTo.named(windowName)
//   //   );
//   // }
//   windowHandle(
//     _type: 'tab' | 'window' | 'either',
//     browser: Browser,
//     _user: UserDriver<NoPlans>,
//     windowName: string,
//     _url: string | URL
//   ): Promise<string> {
//     return browser.window.switchTo.named(windowName);
//   }
// }
