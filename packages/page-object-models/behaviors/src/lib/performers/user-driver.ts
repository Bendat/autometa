import {
  Website,
  Site,
  WebPage,
  Browser,
  PageObject,
} from '@autometa/page-components';
import { Component } from 'react';
import { constructor } from 'tsyringe/dist/typings/types';
import { URL } from 'url';
import {
  Thought,
  Action,
  Observation,
  AssertionFn,
  Observe,
  ThoughtAbout,
  ThoughtFor,
} from '../behaviors';
import { Plans, NoPlans, constructPlans } from '../plans';
import { WindowContext, ContextHandler } from '../subplot';
import {
  QueuedBehavior,
  SubPlot,
  ObservationBehavior,
  ActionBehavior,
  ThoughtBehavior,
  RunningUser,
} from './behavior-trackers';
import { ThoughtFn, ActionFn, ObserverFn } from './types';
import { User } from './user';

interface Memory{
  observation: Observation<PageObject, unknown>
  value: unknown
}
/**
 * Primary implementation of the {@see User} interface. 
 */
export class UserDriver<T extends Plans = NoPlans> {
  private behaviors: QueuedBehavior[] = [];
  private site: Website;
  #plans: T;
  constructor(
    public readonly name: string,
    public readonly role: string,
    public readonly url: string | URL,
    public readonly driver: Browser,
    private userPlans: constructor<T> = NoPlans as constructor<T>
  ) {
    const urlstring = this.url instanceof URL ? this.url.href : this.url;
    this.site = Site(urlstring, driver);
    this.#plans = constructPlans(this.userPlans, this as unknown as User);
  }

  get plans() {
    return this.#plans;
  }
  /**
   * allows context switches to another user
   * @param action
   * @returns
   */
  meanwhile = <K extends User>(
    user: K | (() => K),
    { handler, name, type }: WindowContext,
    then: ContextHandler
  ) => {
    //handle window switches
    this.behaviors.push(
      new SubPlot(async () => {
        const actualUser = typeof user === 'function' ? await user() : user;

        await handler.execute(actualUser, this.driver, name, type);
        await user;
        await then.execute(
          user as unknown as UserDriver,
          this.driver,
          name,
          type
        );
      })
    );
    return this;
  };

  think = async (condition: Thought, about: string) => {
    const fn = (condition: Thought, about: string) => {
      this.thinkingFor(condition);
      this.thinkingAbout(condition);
    };
    this['and'] = fn;
    this['and']['will'] = this.will;
    this['and']['see'] = this.see;
    fn(condition, about);
    return this as unknown as UserDriver & RunningUser<ThoughtFn>;
  };

  will = <T extends WebPage, K extends PageObject>(
    ...actions: Action<T, K>[]
  ) => {
    const fn = async <T extends WebPage, K extends PageObject>(
      ...actions: Action<T, K>[]
    ) => {
      for (const action of actions) {
        this.pendingActionPerformance<T, K>(action);
      }
    };

    this['and'] = fn;
    this['and']['will'] = this.will;
    this['and']['see'] = this.see;
    fn(...actions);
    return this as unknown as UserDriver & RunningUser<ActionFn>;
  };
  #memories: {[key: string]: Memory} = {}
  // remember =  <T extends WebPage, K>(
  //   observer: constructor<T> | Observation<T, K>,
  //   as: string
  // ) => {
  //   const fn = <T extends WebPage, K>(
  //     observer: constructor<T> | Observation<T, K>,
  //     as: string
  //   ) => {
  //   }
  // }
  // recall(memory: string){

  // }
  see = <T extends WebPage, K>(
    observer: constructor<T> | Observation<T, K>,
    assertion: AssertionFn
  ) => {
    // allow string as well as assetion
    // if string, value from assertion will be
    // stored for later.
    // if first param is a string, that value will be provided like
    // an observeration value
    const fn = (
      observer: constructor<T> | Observation<T, K>,
      assertion: AssertionFn
    ) => {
      const type = observer instanceof Observation ? observer.type : observer;
      let performance: () => Promise<void>;

      if (observer instanceof Observation) {
        performance = async () => {
          const element = await observer.select(this.site);
          await assertion(element);
        };
      } else {
        performance = async () => {
          const page = this.site.switch(observer);
          await assertion(page);
        };
      }
      this.behaviors.push(
        new ObservationBehavior(
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

  private pendingActionPerformance<T extends WebPage, K extends PageObject>(
    action: Action<T, K>
  ) {
    this.behaviors.push(
      new ActionBehavior(action, async () => {
        const element = (await action.observing.select(this.site)) as K;
        await action.action(element);
      })
    );
  }

  run = async () => {
    const cached = [...this.behaviors];
    for (const event of cached) {
      await event.performance();
      this.behaviors.shift();
    }
  };

  then = async (
    onFulfilled?:
      | ((value: unknown) => unknown | PromiseLike<unknown>)
      | undefined
      | null
  ): Promise<unknown | never> => {
    if (onFulfilled) {
      return await onFulfilled(this.run());
    }
    return await Promise.resolve(undefined);
  };

  start = async () => {
    await this.site.start();
  };
  finish = async () => {
    return this.site.leave();
  };

  private thinkingAbout = (condition: Thought) => {
    if (condition instanceof ThoughtAbout) {
      const {
        object: { type, selector },
        until,
        args,
      } = condition as ThoughtAbout<WebPage, Component>;
      const performance = async () => {
        // const element = await condition.select(this.site);
        //   const page = this.site.switch(type);
        //   const component: Component = await selector(page);
        //   await page.driver.wait(
        //     until.extract(
        //       component.element,
        //       null as unknown as Locator,
        //       args
        //     ) as WebElementCondition,
        //     condition.duration.timeUnit(condition.duration.time)
        //   );
        // };
        // this.behaviors.push(new ThoughtBehavior(type, condition, performance));
      };
    }
  };

  private thinkingFor = (condition: Thought) => {
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
  };
}
