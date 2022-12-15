import { constructor } from 'tsyringe/dist/typings/types';
import { URL } from 'url';
import { Metadata } from '../../metadata';

export const BrowsesMetadataId = 'focus-group:user:role';
export function browses(
  site: string | URL,
  routes: Record<string, string> = {}
): PropertyDecorator {
  return (target: constructor<unknown>, key: string): void => {
    const fixedSite = typeof site === 'string' ? new URL(site) : site;
    const metaclass = Metadata.of(target).with(BrowsesMetadataId);
    metaclass.append(key, { site: fixedSite, routes });
  };
}

export function getBrowsesMetadata<T>(
  target: constructor<T> | (() => unknown),
  key: string
) {
  return Metadata.of(target.prototype).with(BrowsesMetadataId).get<string>(key);
}
