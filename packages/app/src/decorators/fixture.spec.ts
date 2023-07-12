import "reflect-metadata";
import { Fixture } from "./fixture";
import { test, expect } from "vitest";
import { container as base, inject } from "tsyringe";

@Fixture()
export class InnerFixture {
  myValue = 0;
}
@Fixture()
export class MyFixture {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - auto inject doesn't seem to be working here
  constructor(@inject(InnerFixture) readonly inner: InnerFixture) {}
}
@Fixture()
export class MyFixture2 {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - auto inject doesn't seem to be working here
  constructor(@inject(InnerFixture) readonly inner: InnerFixture) {}
}
test("it should be able to construct the fixture", () => {
  const container = base.createChildContainer();
  const fixture2 = container.resolve(InnerFixture);
  const fixture = container.resolve(MyFixture);
  expect(fixture).toBeDefined();
  expect(fixture).toBeInstanceOf(MyFixture);
  expect(fixture2).toBeDefined();
  expect(fixture.inner).toBeDefined();
  expect(fixture.inner).toBeInstanceOf(InnerFixture);
});
test("it should be container scoped", () => {
  const container = base.createChildContainer();
  const inner = container.resolve(InnerFixture);
  const fixture = container.resolve(MyFixture);
  const fixture2 = container.resolve(MyFixture2);
  expect(inner).toEqual(fixture.inner);
  expect(inner).toEqual(fixture2.inner);
});
