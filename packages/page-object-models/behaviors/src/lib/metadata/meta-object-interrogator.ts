import { Class } from '@autometa/shared-utilities';
import { MetadataInterrogator } from './';

export class MetaObjectInterrogator<T> {
  constructor(
    private readonly targetClass: Class<T>,
    private readonly targetProperty?: string
  ) {}
  with(
    metadataKey: string,
    targetPropertyName?: string
  ): MetadataInterrogator<T> {
    return new MetadataInterrogator<T>(
      this.targetClass,
      metadataKey,
      this.targetProperty ?? targetPropertyName
    );
  }

  get keys() {
    return Reflect.getOwnMetadataKeys(this.targetClass, this.targetProperty);
  }

  get type() {
    return Reflect.getMetadata(
      'design:type',
      this.targetClass,
      this.targetProperty
    );
  }
  get parameters() {
    return Reflect.getMetadata(
      'design:paramtypes',
      this.targetClass,
      this.targetProperty
    );
  }
  get returns() {
    return Reflect.getMetadata(
      'design:returntype',
      this.targetClass,
      this.targetProperty
    );
  }
  descriptor(propertyName: string) {
    return Reflect.getOwnPropertyDescriptor(this.targetClass, propertyName);
  }

  defineProperty<T>(property: string, value: T) {
    Reflect.defineProperty(this.targetClass, property, value);
  }
  getProperty<T>(property: string): T {
    return Reflect.get(this.targetClass, property);
  }
}
