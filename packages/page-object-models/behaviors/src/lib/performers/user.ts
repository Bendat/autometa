import 'reflect-metadata';
import {
  ExtendedActionFn,
  ExtendedObserverFn,
  ExtendedThoughtFn,
  Thenable,
} from '.';
import { NoPlans, Plans } from '../plans';
import { ContextHandler, WindowContext } from '../subplot';

export interface User<T extends Plans = NoPlans> extends Thenable<User<T>> {
  will: ExtendedActionFn;
  see: ExtendedObserverFn;
  think: ExtendedThoughtFn;
  start: () => Promise<void>;
  finish: () => Promise<void>;
  run: () => Promise<void>;
  meanwhile: <K extends User>(
    user: K | (() => K) | (()=>Promise<K>),
    context: WindowContext,
    then: ContextHandler
  ) => User;
  get plans(): T;
}
