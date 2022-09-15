import { By, Condition, WebElementCondition } from 'selenium-webdriver';
import { constructor } from 'tsyringe/dist/typings/types';
import { UntilCondition } from './until/until-condition';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UntilAction = (
  ...args: any[]
) => WebElementCondition | Condition<boolean>;
export interface WaitOptions {
  until: UntilCondition;
  by: By;
  timeout: number;
}
export interface ConstructionOptions<T> extends Partial<WaitOptions> {
  type: constructor<T>;
}
