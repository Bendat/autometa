import 'reflect-metadata';
import { constructor } from 'tsyringe/dist/typings/types';
import { MetaClassInterrogator } from './meta-class-interrogator';
const get = Reflect.getMetadata;
const define = Reflect.defineMetadata;

/**
 * Reflect wrapper for use on classes
 */
export class Metadata {
  static of<T>(target: constructor<T>): MetaClassInterrogator<T> {
    return new MetaClassInterrogator(target);
  }
}
