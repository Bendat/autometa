import { By, Condition, WebElementCondition } from 'selenium-webdriver';
import { constructor } from 'tsyringe/dist/typings/types';
import { UntilCondition } from './until/until-condition';

export type UntilAction = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
