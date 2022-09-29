import 'reflect-metadata'
import {
  Component,
  DriverProxy,
  PageObject,
  Site,
  WebPage,
  Website,
} from '@autometa/page-components';
import {
  Builder,
  Locator,
  WebElementCondition,
} from 'selenium-webdriver';
import { constructor } from 'tsyringe/dist/typings/types';
import { URL } from 'url';
import { Observer, AssertionFn, Action, Thought, ThoughtFor, Page, ThoughtAbout, Observe } from '../behaviors';
import { nameKey, roleKey, browsesKey, namedDriverKey, defaultDriverKey } from '../decorators';

class TempRootPage extends WebPage{

}
interface ObserverFn {
  <T extends WebPage>(...actions: Observer<T, unknown>[]): UserDriver;
}

interface ExtendedObserverFn {
  <T extends WebPage, K>(
    observer: constructor<T> | Observer<T, K>,
    assertion: AssertionFn
  ): User & {
    and: ExtendedObserverFn;
  };
  will: ExtendedActionFn;
  see: ExtendedObserverFn;
  think: ThoughtFn;
}
interface ActionFn {
  <T extends PageObject>(...actions: Action<T>[]): UserDriver;
}
interface ThoughtFn {
  (condition: Thought, about: string): UserDriver;
}
interface ExtendedThoughtFn {
  (condition: Thought, about: string): User & {
    and: ExtendedThoughtFn;
  };
  will: ExtendedActionFn;
  see: ExtendedObserverFn;
  think: ExtendedThoughtFn;
}
interface ExtendedActionFn {
  <T extends WebPage>(...actions: Action<T>[]): User & {
    and: ExtendedActionFn;
  };
  will: ExtendedActionFn;
  see: ExtendedObserverFn;
  think: ExtendedThoughtFn;
}
export enum EnvironmentContext{
  Tab,
  Window,
  Driver,
}
export enum InterludeAction{
  Exit,
  Minimize,
  Switch
}
export const Switch: InterludeAction = InterludeAction.Exit
export const Tab: EnvironmentContext = EnvironmentContext.Tab

export interface User extends Promise<void> {
  will: ExtendedActionFn;
  see: ExtendedObserverFn;
  think: ExtendedThoughtFn;
  start: () => Promise<void>;
  finish: () => Promise<void>;
  run: () => Promise<void>;
  meanwhile: (event: (community: Community)=>Promise<void>, after:InterludeAction, context: EnvironmentContext) => User
}

interface RunningUser<TContext extends ActionFn | ObserverFn | ThoughtFn>
  extends User {
  and: TContext & User;
}

class QueuedBehavior {
  constructor(
    public behavior: 'sees' | 'does' | 'thought' | 'loads',
    public readonly performance: () => Promise<unknown>
  ) {}
}

class ObservationBehavior extends QueuedBehavior {
  constructor(
    public readonly page: constructor<WebPage>,
    public readonly observer: Observer<WebPage, unknown>,
    public readonly assertion: AssertionFn,
    performance: () => Promise<void>
  ) {
    super('sees', performance);
  }
}
class ActionBehavior extends QueuedBehavior {
  constructor(
    public readonly page: constructor<WebPage>,
    public readonly action: Action<WebPage>,
    performance: () => Promise<void>
  ) {
    super('does', performance);
  }
}

class ThoughtBehavior<T extends WebPage> extends QueuedBehavior {
  constructor(
    public readonly page: constructor<WebPage> | undefined,
    public readonly thought: Thought,
    performance: () => Promise<void>
  ) {
    super('thought', performance);
  }
}
export class UserDriver {
  private behaviors: QueuedBehavior[] = [];
  private site: Website;
  constructor(
    public readonly name: string,
    public readonly role: string,
    public readonly url: string | URL,
    public readonly driver: DriverProxy
  ) {
    const urlstring = this.url instanceof URL ? this.url.href : this.url;
    this.site = Site(urlstring, driver);
  }
  /**
   * allows context switches to another user
   * @param action
   * @returns
   */
  #meanwhile = (action: () => void | Promise<void>) => {
    return this;
  };
  think = async (condition: Thought, about: string) => {
    const fn = (condition: Thought, about: string) => {
      if (condition instanceof ThoughtFor) {
        const { time, timeUnit } = condition;
        const duration = timeUnit(time);
        const behavior = new ThoughtBehavior(
          undefined,
          condition,
          () => new Promise((resolve) => setTimeout(resolve, duration))
        );
        this.behaviors.push(behavior);
      }
      if (condition instanceof ThoughtAbout) {
        const {
          object: { type, selector },
          until,
          args,
        } = condition as ThoughtAbout<WebPage, Component>;
        const performance = async () => {
          const page = this.site.switch(type);
          const component: Component = await selector(page);
          await page.driver.wait(
            until.extract(
              component.element,
              null as unknown as Locator,
              args
            ) as WebElementCondition,
            condition.duration.timeUnit(condition.duration.time)
          );
        };
        this.behaviors.push(
          new ThoughtBehavior(type, condition, performance)
        );
      }
    };
    this['and'] = fn;
    this['and']['will'] = this.will;
    this['and']['see'] = this.see;
    fn(condition, about);
    return this as unknown as UserDriver & RunningUser<ThoughtFn>;
  };
  will = <T extends WebPage, K extends Component>(...actions: Action<T>[]) => {
    const fn = async <T extends WebPage>(...actions: Action<T>[]) => {
      for (const action of actions) {
        // const element = await action.on.selector(page);
        // await action.selector(element);
        this.behaviors.push(
          new ActionBehavior(action.on.type, action, async () => {
            const page = this.site.switch(action.on.type);

            const element = await action.on.selector(page);
            await action.selector(element);
          })
        );
      }
    };

    this['and'] = fn;
    this['and']['will'] = this.will;
    this['and']['see'] = this.see;
    fn(...actions);
    return this as unknown as UserDriver & RunningUser<ActionFn>;
  };

  see = <T extends WebPage, K>(
    observer: constructor<T> | Observer<T, K>,
    assertion: AssertionFn
  ) => {
    const fn = (
      observer: constructor<T> | Observer<T, K>,
      assertion: AssertionFn
    ) => {
      const type = observer instanceof Observer ? observer.type : observer;
      const page = this.site.switch(type);
      const performance = async () => {
        if (observer instanceof Observer) {
          const ele = await observer.selector(page);
          await assertion(ele);
        } else {
          await assertion(page);
        }
      };
      this.behaviors.push(
        new ObservationBehavior(
          type,
          Observe(type, (type) => type),
          assertion,
          performance
        )
      );
    };

    this['and'] = fn;
    this['and']['will'] = this.will;
    this['and']['see'] = this.see;

    fn(observer, assertion);
    return this as unknown as UserDriver & RunningUser<ObserverFn>;
  };

  async run() {
    for (const event of this.behaviors) {
      await event.performance();
    }
  }
  async then(
    onFulfilled?: ((value: any) => any | PromiseLike<any>) | undefined | null
  ): Promise<any | never> {
    const foo = await Promise.resolve(1);
    // const foo = await Promise.resolve(this.run());
    if (onFulfilled) {
      return await onFulfilled(this.run());
    }
    return foo;
  }
  async start() {
    await this.site.browse(TempRootPage);
  }
  async finish() {
    return this.site.leave();
  }
}
export abstract class Community {
  [key: string]: User;
}

export function ActingAs<T extends Community>(community: constructor<T>) {
  const cast: Community = new community();
  const names: Set<string> = Reflect.getMetadata(nameKey, cast.constructor);
  for (const name of names.values()) {
    const roleData = Reflect.getMetadata(roleKey(name), community);
    const siteData = Reflect.getMetadata(browsesKey(name), community);
    const driver: Builder =
      Reflect.getMetadata(namedDriverKey(name), community) ??
      Reflect.getMetadata(defaultDriverKey, community);
    cast[name] = new UserDriver(
      name,
      roleData[name].role,
      siteData[name],
      new DriverProxy(driver)
    ) as unknown as User;
  }
  return {
    ...cast,
    leadBy: async (select: string) => {
      await cast[select].start();

      return cast;
    },
  };
}
