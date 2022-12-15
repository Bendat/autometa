
import { constructor } from 'tsyringe/dist/typings/types';
import { MetadataInterrogator } from './';

export class MetaClassInterrogator<T> {
    constructor(private readonly targetClass: constructor<T>) {}
    with(metadataKey: string): MetadataInterrogator<T> {
      return new MetadataInterrogator<T>(this.targetClass, metadataKey);
    }
  
    get keys() {
      return Reflect.getOwnMetadataKeys(this.targetClass);
    }
  
    descriptor(propertyName: string) {
      return Reflect.getOwnPropertyDescriptor(this.targetClass, propertyName);
    }
  }
  