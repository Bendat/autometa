import { Builder } from 'selenium-webdriver';
import { Class } from '@autometa/shared-utilities';
import { Metadata } from '../../metadata';

export const BrowserMetadata = 'focus-group:browser';

/**
 * Configures a class of Participants with a WebDriver,
 * provided through an unbuilt {@link Builder}. The provided
 * builder will be built (and thus started) at test execution time by the
 * facilitator Participant.
 *
 * Will open tabs/windows directing to the webpage urls
 * provided by the `@Browses(URL)` decorator.
 *
 * example:
 * ```
 * // environment-setup.ts
 *
 * import { Vendor } from '@autometa/behaviors';
 *
 * const defaultDriver = new Builder().forBrowser(Vendor.CHROME)
 * const homepageUrl = process.env['BASE_URL']
 *
 * // my-users.ts
 * import { defaultDriver, homepageUrl } from "."
 * import { Browser, Participant } from '@autometa/behaviors';
 *
 * ‎@Browser(defaultDriver)
 * export class MyUsers{
 *  ‎@Role('Customer')
 *  ‎@Browses(homepageUrl)
 *  Kieran: Participant
 * }
 * ```
 * @param builder A configured WebDriver Builder to power the decorated
 * focus group
 * @returns
 */
export function Browser(builder: Builder): ClassDecorator {
  return (target): void => {
    Metadata.of(target as unknown as Class<unknown>)
      .with(BrowserMetadata)
      .define(builder);
  };
}

export function getBrowserMetadata<T>(target: Class<T>): Builder {
  return Metadata.of(target).with(BrowserMetadata).get<Builder>();
}
