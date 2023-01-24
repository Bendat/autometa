import 'reflect-metadata';
import { Metadata } from './metadata';
function testFixtures(metaKey?: string) {
  const TestClass = class TestClass {};
  const metaClass = Metadata.of(TestClass);
  const withKey = metaKey ? metaClass.with(metaKey) : undefined;
  return {
    TestClass,
    metaClass,
    withKey,
  };
}

describe('Metadata tests', () => {
  const metadataKey = 'test:meta:key';

  describe('Appending Metadata to a class', () => {
    it('should add metadata to a class indexed by a key', () => {
      const { TestClass, withKey } = testFixtures(metadataKey);
      const data = withKey.append('testKey', 1234);
      expect(data).toStrictEqual(Reflect.getMetadata(metadataKey, TestClass));
      expect(data).toStrictEqual({ testKey: 1234 });
    });

    it('should append additional metadata cached by a key', () => {
      const { TestClass, withKey } = testFixtures(metadataKey);
      const original = withKey.append('testKey', 1234);
      const appended = withKey.append('testKey2', 100);
      expect(appended).toStrictEqual(
        Reflect.getMetadata(metadataKey, TestClass)
      );
      expect(appended).toStrictEqual({ testKey: 1234, testKey2: 100 });
      expect(original).toStrictEqual(appended);
    });
  });

  describe('Defining metadata', () => {
    it('Should add a new piece of metadata to a class constructor', () => {
      const { TestClass, withKey } = testFixtures(metadataKey);
      const data = withKey.define(1234);
      const retrieved = Reflect.getMetadata(metadataKey, TestClass);
      expect(retrieved).toEqual(data);
    });

    it('Should throw an error if the same key is defined more than once on a class', () => {
      const { withKey } = testFixtures(metadataKey);
      withKey.define(1234);
      const action = () => withKey.define(1234);
      expect(action).toThrow(
        `Cannot add metadata to an object using a key which has already been defined on it`
      );
    });
  });
});
