import { getCallerFiles } from './caller-site';

export function getCallerFromIndex(index: number) {
  const files = getCallerFiles();
  if (index < 0 || index >= files.length) {
    throw Error(
      'A caller site index must be between 0 & ' + (files.length - 1)
    );
  }
  return getCallerFiles()[index].getFileName();
}
