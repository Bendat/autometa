import { WebPage } from '@autometa/page-components';
import { expect } from 'chai';
import { URL } from 'url';
import { For, Seconds, ThoughtFor, TimeUnitTransformer } from './thoughts';
export type AssertionFn = (...comparedTo: unknown[]) => void | Promise<void>;

/**
 * Asserts the provided value is (deeply) equal to the value retrieved
 * from an Observation.
 *
 * @param expected The value the user expects to see
 * Example:
 * ```
 * await User.see(SomeParagraph, Is('lorem ipsum'))
 * ```
 */
export function Is<T>(expected: T): AssertionFn {
  return async function Is<K>(comparedTo: K | T) {
    expect(await comparedTo).to.eql(expected);
  };
}
/**
 * Asserts that the expected value is strictly equal
 * to the Observed value, and has the same identity.
 * @param expected  The value the user expects to see
 */
export function Equals<T>(expected: T): AssertionFn {
  return async function Is<K>(comparedTo: K | T) {
    expect(await comparedTo).to.eql(expected);
  };
}
/**
 * Asserts that an observed value can be parsed into
 * a number. Optionally it compares the result to
 * an expected value
 * @param expected The number which should be equal to the observed value
 */
export function IsNumber(expected?: number): AssertionFn {
  return async function IsNumber(
    comparedTo: number | string | Promise<number | string>
  ) {
    const cast = Number(await comparedTo);
    expect(cast).to.be.not.NaN;
    if (expected) {
      expect(cast).to.equal(expected);
    }
  };
}

/**
 * Asserts that an Observed value can be converted to a number,
 * and if it can, that it is approximately equal to an expected value,
 * within some provided precision.
 * i.e
 * ```
 * isApproximately(1, 0.1)('0.9') // true - numeric, within precision range, no error`
 *
 * isApproximately(1, 0.1)(1.2) // false - outside precision range, error`
 *
 * isApproximately(1, 0.1)('aaa') // false - not numeric, error
 * ```
 * @param expected The value the user expects to see
 * @param precision The floating precision the actual value must be within
 */
export function IsApproximately(
  expected: number,
  precision: number
): AssertionFn {
  return async function IsApproximately(
    comparedTo: number | string | Promise<number | string>
  ) {
    const cast = Number(await comparedTo);
    expect(cast).to.be.not.NaN;
    expect(cast).to.be.closeTo(expected, precision);
  };
}
/**
 * Asserts that an Observed value can be converted to a number,
 * and if it can, that it is greater than the expected value.
 * ```
 * isGreaterThan(10)(11) // no error
 * isGreaterThan(10)('11') // no error
 * isGreaterThan(10)(9) // assertion error
 * ```
 * @param expected The value the user expects to be smaller than the actual
 */
export function IsGreaterThan(expected: number): AssertionFn {
  return async function IsGreaterThan(comparedTo: number | Promise<number>) {
    const cast = Number(await comparedTo);
    expect(cast).to.be.not.NaN;
    expect(cast).to.be.greaterThan(expected);
  };
}

export const Within = (time: number, unit: TimeUnitTransformer) => {
  return For(time, unit);
};

/**
 * Asserts that a {@link Webpage} has a specific
 * title, within the provided amount of time (default 2 seconds).
 *
 * If after that time the title has not become equal to the expected value,
 * an error is thrown
 * @param title The title the {@link WebPage} should have
 * @param within The amount of time for the title to update before erroring
 */
export function HasTitle(
  title: string,
  within: ThoughtFor = Within(2, Seconds)
): AssertionFn {
  return async function HasTitle(page: WebPage) {
    await page.waitForTitleIs(title, within.milliseconds);
  };
}
/**
 * Asserts that a {@link Webpage} title contains an expected substring,
 * within the provided amount of time (default 2 seconds).
 *
 * If after that time the title does not contain to the expected value,
 * an error is thrown
 * @param title The title substring the {@link WebPage} title should have
 * @param within The amount of time for the title to update before erroring
 */
export function TitleContains(
  title: string,
  within: ThoughtFor = Within(2, Seconds)
): AssertionFn {
  return async function TitleContains(page: WebPage) {
    await page.waitForTitleContains(title, within.milliseconds);
  };
}

/**
 * Asserts that a {@link Webpage} title matches an expected regex patter,
 * within the provided amount of time (default 2 seconds).
 *
 * If after that time the title does not match expected pattern,
 * an error is thrown
 * @param pattern The pattern that the {@link WebPage} title should match
 * @param within The amount of time for the title to update before erroring
 */
export function TitleMatches(
  pattern: RegExp,
  within: ThoughtFor = Within(2, Seconds)
): AssertionFn {
  return async function TitleMatches(page: WebPage) {
    await page.waitForTitleMatches(pattern, within.milliseconds);
  };
}
/**
 * Asserts that a {@link Webpage} has a specific
 * url, within the provided amount of time (default 2 seconds).
 *
 * If after that time the url has not become equal to the expected value,
 * an error is thrown
 * @param url The url the {@link WebPage} should have
 * @param within The amount of time for the url to update before erroring
 */
export function HasURL(
  url: string | URL,
  within: ThoughtFor = Within(2, Seconds)
): AssertionFn {
  return async function HasURL(page: WebPage) {
    const path = url instanceof URL ? url.href : url;
    await page.waitForURLIs(path, within.milliseconds);
  };
}
/**
 * Asserts that a {@link Webpage} url contains an expected substring,
 * within the provided amount of time (default 2 seconds).
 *
 * If after that time the url does not contain to the expected value,
 * an error is thrown
 * @param url The url substring the {@link WebPage} url should have
 * @param within The amount of time for the url to update before erroring
 */
export function URLContains(
  url: string | URL,
  within: ThoughtFor = Within(2, Seconds)
): AssertionFn {
  return async function URLContains(page: WebPage) {
    const path = url instanceof URL ? url.href : url;
    await page.waitForURLContains(path, within.milliseconds);
  };
}
/**
 * Asserts that a {@link Webpage} url matches an expected regex patter,
 * within the provided amount of time (default 2 seconds).
 *
 * If after that time the url does not match expected pattern,
 * an error is thrown
 * @param pattern The pattern that the {@link WebPage} url should match
 * @param within The amount of time for the url to update before erroring
 */
export function URLMatches(
  pattern: RegExp,
  within: ThoughtFor = Within(2, Seconds)
): AssertionFn {
  return async function URLMatches(page: WebPage) {
    await page.waitForURLMatches(pattern, within.milliseconds);
  };
}
