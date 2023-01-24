import { Class } from '@autometa/shared-utilities';
import { Metadata } from '../../metadata/metadata';
import { addParticipantToFocusGroup } from './participant-decorator';

export const RoleMetadata = 'focus-group:user:role';

/**
 * Defines a Participant's Role in the test domain.
 * The could be technical titles like "Tester" "User", and "Admin"
 * or describe their role as consumers of your system,
 * such as "Customer", "Seller", "Client", "Partner" etc.
 *
 * This is metadata that documents the user and provides
 * direction for what parts of a website they should visit,
 * and what kind of actions they should take.
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
 * @param title the role title of this user
 * @return a decorator function
 */
export function Role(title: string): PropertyDecorator {
  return (target: Class<unknown>, key: string): void => {
    addParticipantToFocusGroup(target, key);
    Metadata.of(target, key).with(RoleMetadata).define(title);
  };
}

export function getRoleMetadata<T>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  target: Class<T>,
  key: string
) {
  return Metadata.of(target.prototype ?? target.constructor ?? target, key)
    .with(RoleMetadata)
    .get<string>();
}
