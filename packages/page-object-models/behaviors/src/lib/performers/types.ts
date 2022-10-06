import { PageObject, WebPage } from '@autometa/page-components';
import { constructor } from 'tsyringe/dist/typings/types';
import { Observation, AssertionFn, Action, Thought } from '../behaviors';
import { User } from './user';
import { UserDriver } from './user-driver';

export interface ObserverFn {
  <T extends WebPage>(...actions: Observation<T, unknown>[]): UserDriver;
}

export interface ExtendedObserverFn {
  <T extends PageObject, K>(
    observer: constructor<T> | Observation<T, K>,
    assertion: AssertionFn
  ): User & {
    and: ExtendedObserverFn;
  };
  will: ExtendedActionFn;
  see: ExtendedObserverFn;
  think: ThoughtFn;
}
export interface ActionFn {
  <T extends PageObject, K extends PageObject>(
    ...actions: Action<T, K>[]
  ): UserDriver;
}
export interface ThoughtFn {
  (condition: Thought, about: string): UserDriver;
}
export interface ExtendedThoughtFn {
  (condition: Thought, about: string): User & {
    and: ExtendedThoughtFn;
  };
  will: ExtendedActionFn;
  see: ExtendedObserverFn;
  think: ExtendedThoughtFn;
}
export interface ExtendedActionFn {(
    ...actions: Action<PageObject, PageObject>[]
  ): User & {
    and: ExtendedActionFn;
  };
  will: ExtendedActionFn;
  see: ExtendedObserverFn;
  think: ExtendedThoughtFn;
}
type fulfilled = ((value: any) => any | PromiseLike<any>) | undefined | null;

export interface ThenMethod<T = never> {
  (onFulfilled: fulfilled): Promise<T>;
}

export interface Thenable<T = never> {
  then(onFulfilled: fulfilled): Promise<T>;
}