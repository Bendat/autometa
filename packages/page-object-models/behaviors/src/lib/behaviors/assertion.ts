import { WebPage } from '@autometa/page-components';
import { expect } from '@jest/globals';
import { For, Seconds, ThoughtFor, TimeUnitTransformer } from './thoughts';
export type AssertionFn = (...comparedTo: any) => void | Promise<void>;
export interface TimedAssertionFn {
  (...comparedTo: any): void | Promise<void>;
  within: (time: number, unit: TimeUnitTransformer) => AssertionFn;
}
class AssertionError extends Error {}

export function Is<T>(value: T): AssertionFn {
  return async function Is<K>(comparedTo: K | T) {
    expect(await comparedTo).toBe(value);
  };
}

export function IsNumber(value?: number): AssertionFn {
  return async function IsNumber(comparedTo: number | Promise<number>) {
    expect(Number(await comparedTo)).not.toBeNaN();
    if (value) {
      expect(await comparedTo).toEqual(value);
    }
  };
}

export function Includes<T>(value: T): AssertionFn {
  return function Includes<K>(collection: K[]) {
    expect(collection).toContain(value);
  };
}

export function StrictIncludes<T>(value: T): AssertionFn {
  return async function StrictIncludes<K>(collection: K[] | Promise<K[]>) {
    expect(await collection).toContainEqual(value);
  };
}

export function IsApproximately(value: number, precision: number): AssertionFn {
  return async function IsApproximately(comparedTo: number | Promise<number>) {
    expect(await comparedTo).toBeCloseTo(value, precision);
  };
}

export function IsGreaterThan(value: number): AssertionFn {
  return async function IsGreaterThan(comparedTo: number | Promise<number>) {
    expect(await comparedTo).toBeGreaterThan(value);
  };
}

export const Within = (time: number, unit: TimeUnitTransformer) => {
  return For(time, unit);
};

export function HasTitle(
  title: string,
  within: ThoughtFor = Within(2, Seconds)
): AssertionFn {
  return async function HasTitle(page: WebPage) {
    await page.waitForTitleIs(title, within.milliseconds);
    expect(await page.title).toBe(title);
  };
}
