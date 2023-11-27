import { Locator } from "playwright";

export type LocatorOptions<
  TName extends keyof Locator,
  TIndex extends number = 1
> = Parameters<Locator[TName]>[TIndex];

export type AriaRoles = Parameters<Locator["getByRole"]>[0];

export interface Constructable {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): any;
}
