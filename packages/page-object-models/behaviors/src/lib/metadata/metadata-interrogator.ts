import { Class } from '@autometa/shared-utilities';
const define = Reflect.defineMetadata;
/**
 * Wraps a target and a metadata key into an interrogator
 * instance which can create, read, update and delete
 * metadata on a target for that metadata key.
 */
export class MetadataInterrogator<T> {
  constructor(
    private readonly targetClass: Class<T>,
    private readonly metadataKey: string,
    private readonly targetProperty?: string
  ) {}
  get keys() {
    return Reflect.getOwnMetadataKeys(this.targetClass, this.targetProperty);
  }

  get value() {
    return this.get();
  }

  get ownValue() {
    return Reflect.getOwnMetadata(
      this.targetClass,
      this.metadataKey,
      this.targetProperty
    );
  }

  get exists() {
    return Reflect.getMetadata(
      this.metadataKey,
      this.targetClass,
      this.targetProperty
    )
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
      define(this.metadataKey, {}, this.targetClass, this.targetProperty);
    }
    const dataObject = this.get<Record<string, T>>();

    dataObject[dataKey] = metadata;
    // define(this.metadataKey, dataObject, this.targetClass);
    return dataObject;
  }

  get<T>(name?: string): T {
    const result = Reflect.getMetadata(
      this.metadataKey,
      this.targetClass,
      this.targetProperty
    );
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

  define<T>(data: T, errorMessage?: string) {
    if (this.value) {
      throw new Error(
        errorMessage ??
          `Cannot add metadata to an object using a key which has already been defined on it`
      );
    }
    Reflect.defineMetadata(
      this.metadataKey,
      data,
      this.targetClass,
      this.targetProperty
    );
    return data;
  }

  delete() {
    Reflect.deleteMetadata(
      this.metadataKey,
      this.targetClass,
      this.targetProperty
    );
  }

  update<TMetadataType>(data: TMetadataType) {
    Reflect.deleteMetadata(
      this.metadataKey,
      this.targetClass,
      this.targetProperty
    );
    define(this.metadataKey, data, this.targetClass);
    return data;
  }

  /**
   * Adds data to a collection of metadata on the target.
   * Duplicate entries will be ignored.
   * @param data A _copy_ of the current state of the collection
   */
  collect<TMetadataType>(data: TMetadataType) {
    let set: Set<TMetadataType> = Reflect.getMetadata(
      this.metadataKey,
      this.targetClass,
      this.targetProperty
    );
    if (!set) {
      set = new Set();

      Reflect.defineMetadata(
        this.metadataKey,
        set,
        this.targetClass,
        this.targetProperty
      );
    }
    set.add(data);
    return [...set];
  }

  /**
   * Returns a _copy_ of a collection attached to this object as metadata,
   * if any.
   */
  get collection() {
    const set: Set<unknown> = Reflect.getMetadata(
      this.metadataKey,
      this.targetClass,
      this.targetProperty
    );
    if (set && !(set instanceof Set)) {
      throw new Error(
        `${this.targetClass} with meta key ${this.metadataKey} is defined but it is not a valid collection. To add a valid collection use the \`collect\` method.`
      );
    }
    if (!set) {
      return [];
    }
    return [...set];
  }
}
