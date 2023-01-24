import 'reflect-metadata';
import { MetadataInterrogator } from './metadata-interrogator';

describe('Managing metadata on a class', () => {
  const metadataKey = 'test:meta:key';
  const setup = () => {
    const TestClass = class TestClass {};
    const interrogator = new MetadataInterrogator(TestClass, metadataKey);

    return {
      TestClass,
      interrogator,
    };
  };
  describe('append - Appending Metadata to a class', () => {
    it('should add metadata to a class indexed by a key', () => {
      const { TestClass, interrogator } = setup();
      const data = interrogator.append('testKey', 1234);
      expect(data).toStrictEqual(Reflect.getMetadata(metadataKey, TestClass));
      expect(data).toStrictEqual({ testKey: 1234 });
    });

    it('should append additional metadata cached by a key', () => {
      const { TestClass, interrogator } = setup();

      const original = interrogator.append('testKey', 1234);
      const appended = interrogator.append('testKey2', 100);
      expect(appended).toStrictEqual(
        Reflect.getMetadata(metadataKey, TestClass)
      );
      expect(appended).toStrictEqual({ testKey: 1234, testKey2: 100 });
      expect(original).toStrictEqual(appended);
    });
  });

  describe('define - Defining metadata for a class with a key', () => {
    it('Should add a new piece of metadata to a class constructor', () => {
      const { TestClass, interrogator } = setup();

      const data = interrogator.define(1234);
      const retrieved = Reflect.getMetadata(metadataKey, TestClass);
      expect(retrieved).toEqual(data);
    });

    it('Should throw an error if the same key is defined more than once on a class', () => {
      const { interrogator } = setup();

      interrogator.define(1234);
      const action = () => interrogator.define(1234);
      expect(action).toThrow(
        `Cannot add metadata to an object using a key which has already been defined on it`
      );
    });
  });
  describe('update - Updating mor defining metadata on a class for a key', () => {
    it('Should add a new piece of metadata to a class constructor', () => {
      const { TestClass, interrogator } = setup();

      const data = interrogator.update(1234);
      const retrieved = Reflect.getMetadata(metadataKey, TestClass);
      expect(retrieved).toEqual(data);
    });
    it('Should add a new piece of metadata to a class constructor', () => {
      const { TestClass, interrogator } = setup();

      interrogator.define(1234);
      const newData = interrogator.update('hello');
      const retrieved = Reflect.getMetadata(metadataKey, TestClass);
      expect(retrieved).toEqual(newData);
    });
  });
  describe('use - Using metadata values directly in a callback', () => {
    it('Should do nothing on a class with no metadata', () => {
      const { interrogator } = setup();
      const cb = jest.fn();
      const onMissing = jest.fn();
      interrogator.use(cb, onMissing);
      expect(cb).not.toHaveBeenCalled();
      expect(onMissing).toHaveBeenCalled();
    });
    it('Should perform a callback action on metadata', () => {
      const { interrogator } = setup();
      interrogator.define(1234);
      const cb = jest.fn();
      const onMissing = jest.fn();
      interrogator.use(cb, onMissing);
      expect(cb).toHaveBeenCalledWith(1234);
    });
  });

  describe('get - Getting metadata values from a class by key with generic typing', () => {
    it('Should return undefined if no metadata exists for a key', () => {
      const { interrogator } = setup();
      const data = interrogator.get();
      expect(data).toBeUndefined();
    });
    it('Should return metadata', () => {
      const { interrogator } = setup();
      interrogator.define(1234);
      const data = interrogator.get();
      expect(data).toBe(1234);
    });
  });

  describe('value - View the value of a meta key without generic typing', () => {
    it('Should return undefined if no metadata exists for a key', () => {
      const { interrogator } = setup();
      const data = interrogator.value;
      expect(data).toBeUndefined();
    });
    it('Should return metadata', () => {
      const { interrogator } = setup();
      interrogator.define(1234);
      const data = interrogator.value;
      expect(data).toBe(1234);
    });
  });
  describe('collect - Collecting a list of metadata', () => {
    it('Should collect an item in metadata', () => {
      const { interrogator } = setup();
      interrogator.collect(1);
      const data = interrogator.collect(2);
      expect(data).toEqual([1, 2]);
    });
  });

  describe('collection - Viewing a collection', () => {
    it('should view a collection', () => {
      const { interrogator } = setup();
      interrogator.collect(1);
      interrogator.collect(2);
      const data = interrogator.collection;
      expect(data).toEqual([1, 2]);
    });
  });
});

describe('Managing metadata on a class property', () => {
  const metadataKey = 'test:meta:key';
  const setup = () => {
    const TestClass = class TestClass {
      first: number;
    };
    const interrogator = new MetadataInterrogator(
      TestClass,
      metadataKey,
      'first'
    );

    return {
      TestClass,
      interrogator,
    };
  };
  describe('append - Appending Metadata to a class', () => {
    it('should add metadata to a class indexed by a key', () => {
      const { TestClass, interrogator } = setup();
      const data = interrogator.append('testKey', 1234);
      expect(data).toStrictEqual(
        Reflect.getMetadata(metadataKey, TestClass, 'first')
      );
      expect(data).toStrictEqual({ testKey: 1234 });
    });

    it('should append additional metadata cached by a key', () => {
      const { TestClass, interrogator } = setup();

      const original = interrogator.append('testKey', 1234);
      const appended = interrogator.append('testKey2', 100);
      expect(appended).toStrictEqual(
        Reflect.getMetadata(metadataKey, TestClass, 'first')
      );
      expect(appended).toStrictEqual({ testKey: 1234, testKey2: 100 });
      expect(original).toStrictEqual(appended);
    });
  });

  describe('define - Defining metadata for a class with a key', () => {
    it('Should add a new piece of metadata to a class constructor', () => {
      const { TestClass, interrogator } = setup();

      const data = interrogator.define(1234);
      const retrieved = Reflect.getMetadata(metadataKey, TestClass, 'first');
      expect(retrieved).toEqual(data);
    });

    it('Should throw an error if the same key is defined more than once on a class', () => {
      const { interrogator } = setup();

      interrogator.define(1234);
      const action = () => interrogator.define(1234);
      expect(action).toThrow(
        `Cannot add metadata to an object using a key which has already been defined on it`
      );
    });
  });
  describe('update - Updating mor defining metadata on a class for a key', () => {
    it('Should add a new piece of metadata to a class constructor', () => {
      const { TestClass, interrogator } = setup();

      const data = interrogator.update(1234);
      const retrieved = Reflect.getMetadata(metadataKey, TestClass);
      expect(retrieved).toEqual(data);
    });
    it('Should add a new piece of metadata to a class constructor', () => {
      const { TestClass, interrogator } = setup();

      interrogator.define(1234);
      const newData = interrogator.update('hello');
      const retrieved = Reflect.getMetadata(metadataKey, TestClass);
      expect(retrieved).toEqual(newData);
    });
  });
  describe('use - Using metadata values directly in a callback', () => {
    it('Should do nothing on a class with no metadata', () => {
      const { interrogator } = setup();
      const cb = jest.fn();
      const onMissing = jest.fn();
      interrogator.use(cb, onMissing);
      expect(cb).not.toHaveBeenCalled();
      expect(onMissing).toHaveBeenCalled();
    });
    it('Should perform a callback action on metadata', () => {
      const { interrogator } = setup();
      interrogator.define(1234);
      const cb = jest.fn();
      const onMissing = jest.fn();
      interrogator.use(cb, onMissing);
      expect(cb).toHaveBeenCalledWith(1234);
    });
  });

  describe('get - Getting metadata values from a class by key with generic typing', () => {
    it('Should return undefined if no metadata exists for a key', () => {
      const { interrogator } = setup();
      const data = interrogator.get();
      expect(data).toBeUndefined();
    });
    it('Should return metadata', () => {
      const { interrogator } = setup();
      interrogator.define(1234);
      const data = interrogator.get();
      expect(data).toBe(1234);
    });
  });

  describe('value - View the value of a meta key without generic typing', () => {
    it('Should return undefined if no metadata exists for a key', () => {
      const { interrogator } = setup();
      const data = interrogator.value;
      expect(data).toBeUndefined();
    });
    it('Should return metadata', () => {
      const { interrogator } = setup();
      interrogator.define(1234);
      const data = interrogator.value;
      expect(data).toBe(1234);
    });
  });
  describe('collect - Collecting a list of metadata', () => {
    it('Should collect an item in metadata', () => {
      const { interrogator } = setup();
      interrogator.collect(1);
      const data = interrogator.collect(2);
      expect(data).toEqual([1, 2]);
    });
  });

  describe('collection - Viewing a collection', () => {
    it('should view a collection', () => {
      const { interrogator } = setup();
      interrogator.collect(1);
      interrogator.collect(2);
      const data = interrogator.collection;
      expect(data).toEqual([1, 2]);
    });
  });
});
