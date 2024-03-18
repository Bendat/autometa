import { describe, it, expect } from "vitest";
import {
  AccessTracker,
  GetAccessedCount,
  GetAssignedValues,
  TrackAccess,
} from "./access-tracker";

describe("AccessTracker", () => {
  describe("accesses", () => {
    it("should get 0 accesses for a new object", () => {
      const obj = AccessTracker([], { foo: undefined });
      expect(GetAccessedCount(obj, "foo")).toBe(0);
    });
    it("should get 1 access for a new object with a value", () => {
      const obj = AccessTracker([], { foo: 1 });
      expect(GetAccessedCount(obj, "foo")).toBe(1);
    });
    it("should get 2 access for an accessed object", () => {
      const obj = AccessTracker([], { foo: 1 });
      expect(obj.foo).toBe(1);
      expect(GetAccessedCount(obj, "foo")).toBe(2);
    });
    it("it should throw an error when accessing a never-assigned value", () => {
      const obj = AccessTracker([], {} as { foo: number });
      expect(() => obj.foo).toThrowError();
    });
  });
  describe("assignments", () => {
    it("should get 1 assignments for a new object with a value", () => {
      const obj = AccessTracker([], { foo: 1 });
      expect(GetAssignedValues(obj, "foo")).toEqual([1]);
    });
    it("should get 0 assignments for a new object", () => {
      const obj = AccessTracker([], { foo: undefined });
      expect(GetAssignedValues(obj, "foo")).toEqual([]);
    });
    it("should get 1 assignment for an assigned to object", () => {
      const obj = AccessTracker([], { foo: 1 });
      obj.foo = 2;
      expect(GetAssignedValues(obj, "foo")).toEqual([1, 2]);
    });
    it("should get 1 assignment for an assigned undefined value", () => {
      const obj = AccessTracker([], { foo: 1 });
      obj.foo = undefined as unknown as number;
      expect(GetAssignedValues(obj, "foo")).toEqual([1, undefined]);
    });
  });
});

@TrackAccess<TestFixture>()
class TestFixture {
  foo = 1;
  bar = 2;
  baz = 3;
}

describe("decorator", () => {
  it("should track accesses", () => {
    const fixture = new TestFixture();
    expect(fixture.foo).toBe(1);
    expect(fixture.bar).toBe(2);
    expect(fixture.baz).toBe(3);
    expect(GetAccessedCount(fixture, "foo")).toBe(2);
    expect(GetAccessedCount(fixture, "bar")).toBe(2);
    expect(GetAccessedCount(fixture, "baz")).toBe(2);
    expect(fixture).instanceOf(TestFixture);
  });
  it("should track assignments", () => {
    const fixture = new TestFixture();
    fixture.foo = 2;
    fixture.bar = 3;
    fixture.baz = 4;
    expect(GetAssignedValues(fixture, "foo")).toEqual([1, 2]);
    expect(GetAssignedValues(fixture, "bar")).toEqual([2, 3]);
    expect(GetAssignedValues(fixture, "baz")).toEqual([3, 4]);
  });
});
