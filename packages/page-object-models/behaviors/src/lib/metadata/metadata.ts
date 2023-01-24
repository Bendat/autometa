import 'reflect-metadata';
import { Class } from '@autometa/shared-utilities';
import { MetaObjectInterrogator } from './meta-object-interrogator';

/**
 * Reflect wrapper for use on classes
 */
export class Metadata {
  static of<T>(
    target: Class<T>,
    propertyName?: string
  ): MetaObjectInterrogator<T> {
    return new MetaObjectInterrogator(target, propertyName);
  }
}
