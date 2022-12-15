import { constructor } from 'tsyringe/dist/typings/types';
const get = Reflect.getMetadata;
const define = Reflect.defineMetadata;
export class MetadataInterrogator<T> {
  constructor(
    private readonly targetClass: constructor<T>,
    private readonly metadataKey: string
  ) {}
  get keys() {
    return Reflect.getOwnMetadataKeys(this.targetClass, this.metadataKey);
  }

  get value() {
    return this.get();
  }

  get ownValue() {
    return Reflect.getOwnMetadata(this.targetClass, this.metadataKey);
  }

  get exists() {
    return Reflect.getMetadata(this.metadataKey, this.targetClass)
      ? true
      : false;
  }
  /**
   * Attaches the provided `data` object to the prototype of the `target` class, which
   * is stored in a key-value Object. Duplicate values are overridden.
   * @param dataKey The property name of the metadata object
   * @param metadata The metadata to be associated with the target
   * @returns a copy of the metadata object attached to the target
   */
  append<T>(dataKey: string, metadata: T): Record<string, T> {
    const existing = this.get<Record<string, T>>();
    if (!existing) {
      define(this.metadataKey, {}, this.targetClass);
    }
    const dataObject = this.get<Record<string, T>>();
    dataObject[dataKey] = metadata;
    // define(this.metadataKey, dataObject, this.targetClass);
    return dataObject;
  }

  get<T>(name?: string): T {
    const result = Reflect.getMetadata(this.metadataKey, this.targetClass);
    if (name && result) {
      return result[name];
    }
    return result;
  }

  use<T>(action: (data: T) => void, onMissing: () => void): T {
    const data = this.get<T>();
    if (data) action(data);
    else onMissing();
    return data;
  }

  define<T>(data: T) {
    if (this.value) {
      throw new Error(
        `Cannot add metadata to an object using a key which has already been defined on it`
      );
    }
    Reflect.defineMetadata(this.metadataKey, data, this.targetClass);
    return data;
  }

  delete() {
    Reflect.deleteMetadata(this.metadataKey, this.targetClass);
  }

  update<T>(data: T) {
    Reflect.deleteMetadata(this.metadataKey, this.targetClass);
    define(this.metadataKey, data, this.targetClass);
    return data;
  }
}
