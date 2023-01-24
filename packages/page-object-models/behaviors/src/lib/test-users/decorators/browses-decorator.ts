import { Class } from '@autometa/shared-utilities';
import { URL } from 'url';
import { Metadata } from '../../metadata';
import { addParticipantToFocusGroup } from './participant-decorator';

export const BrowsesMetadata = 'focus-group:user:browses';
export class SiteLocation {
  constructor(public site: URL, public routes: Record<string, string> = {}) {}
}
/**
 * Defines the website URL that this user is designated to
 * act on. While not enforced this may be related to the users 
 * Role. For example, by product convention a "Customer" type user
 * may be expected to browse "http://our-product.com", while a "Seller"
 * may typically use "http://portal.our-product.com".
 * 
 * example:
 * ```
 * // environment-setup.ts
 *
 * import { Vendor } from '@autometa/behaviors';
 *
 * const defaultDriver = new Builder().forBrowser(Vendor.CHROME)
 * const homepageUrl = process.env['BASE_URL'] // or new URL(process.env[BASE_URL])
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
 * @param site The URL/IP Address of the target website
 */
export function Browses(site: string | URL): PropertyDecorator {
  return (target: Class<unknown>, key: string): void => {
    addParticipantToFocusGroup(target, key);
    const fixedSite = typeof site === 'string' ? new URL(site) : site;
    const siteData = new SiteLocation(fixedSite);
    Metadata.of(target, key).with(BrowsesMetadata).define(siteData);
  };
}

export function getBrowsesMetadata<T>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  target: Class<T> | Function,
  key: string
): SiteLocation {
  return Metadata.of(target.prototype ?? target.constructor, key)
    .with(BrowsesMetadata)
    .get<SiteLocation>();
}
