import { describe, it, expect, beforeEach } from "vitest";
import {
  clearRegistries,
  getContainerContexts,
  getSingleton,
  hasContainerContext,
  registerContainerContext,
  registerSingleton
} from "./metadata-registry";
import { defineContainerContext } from "./container-context";
import { Token } from "./token";

describe("metadata-registry", () => {
  class TestClass {}
  class InnerTestClass {}
  describe("registerSingleton", () => {
    beforeEach(() => {
      clearRegistries();
    });

    it("should register a singleton", () => {
      const instance = new TestClass();
      registerSingleton(TestClass, instance);
      expect(getSingleton(TestClass)).toBeInstanceOf(TestClass);
    });

    it("should register a singleton with a base class", () => {
      class TestClass2 extends TestClass {}
      const instance = new TestClass2();
      registerSingleton(TestClass, instance);
      expect(getSingleton(TestClass)).toBeInstanceOf(TestClass2);
    });

    it("should register a singleton with a derived class", () => {
      class TestClass2 extends TestClass {}
      const instance = new TestClass();
      registerSingleton(TestClass2, instance);
      expect(getSingleton(TestClass2)).toBeInstanceOf(TestClass);
    });

    it("should return undefined if the singleton is not registered", () => {
      expect(getSingleton(TestClass)).toBeUndefined();
    });

    it("should register a singleton with a token", () => {
      const instance = new TestClass();
      registerSingleton(Token("foo"), instance);
      expect(getSingleton(Token("foo"))).toBeInstanceOf(TestClass);
    });
  });

  describe("container context", () => {
    it("should register an instance with a container", () => {
      const context = defineContainerContext("foo");
      const instance = new InnerTestClass();
      registerContainerContext(context, TestClass, instance);
      expect(getContainerContexts(context, TestClass)).toBe(instance);
    });

    it("should return true if a container context is registered", () => {
      const context = defineContainerContext("foo");
      const instance = new InnerTestClass();
      registerContainerContext(context, TestClass, instance);
      expect(hasContainerContext(context, TestClass)).toBe(true);
    });

    it("should register a container context with a token", () => {
      const context = defineContainerContext("foo");
      const instance = new InnerTestClass();
      registerContainerContext(context, Token("bar"), instance);
      expect(getContainerContexts(context, Token("bar"))).toBe(instance);
    });
  });
});
