import type { AssertionPlugin } from "@autometa/assertions";

import type { Order, OrderItem } from "../../../../.api/src/types/domain.js";

export interface OrderAssertions {
  current(): Order;
  item(index?: number): OrderItem;
  statusIs(expected: string): void;
  milkIs(expected: string): void;
  sweetenerIs(expected: string): void;
}

type WorldWithOrder = {
  readonly scenario: {
    readonly order?: Order;
  };
};

/**
 * Domain assertion plugin for working with Brew Buddy orders.
 *
 * Intentionally depends only on `world.scenario.order` so it can be used from
 * both step definitions and domain services without creating module cycles.
 */
export const orderAssertionsPlugin = <World extends WorldWithOrder>(): AssertionPlugin<
  World,
  OrderAssertions
> =>
  ({ ensure }) =>
  (world) => {
    const requireOrder = (): Order =>
      ensure.always(world.scenario.order, {
        label: "No order has been recorded for the current scenario.",
      })
        .toBeDefined()
        .value as Order;

    const requireItem = (index = 0): OrderItem => {
      const order = requireOrder();
      const item = order.items[index];
      return ensure.always(item, {
        label: "Order does not contain any items to verify item preferences.",
      })
        .toBeDefined()
        .value as OrderItem;
    };

    const normalise = (value: unknown): string => String(value ?? "").trim().toLowerCase();

    return {
      current() {
        return requireOrder();
      },
      item(index) {
        return requireItem(index);
      },
      statusIs(expected) {
        const order = requireOrder();
        ensure(order.status, {
          label: `Expected order status to be "${expected}" but was "${order.status}".`,
        }).toStrictEqual(expected);
      },
      milkIs(expected) {
        const item = requireItem(0);
        const actual = item.milk ?? "";
        ensure(normalise(actual), {
          label: `Expected milk preference to be "${expected}" but was "${actual}".`,
        }).toStrictEqual(normalise(expected));
      },
      sweetenerIs(expected) {
        const item = requireItem(0);
        const actual = item.sweetener ?? "";
        ensure(normalise(actual), {
          label: `Expected sweetener preference to be "${expected}" but was "${actual}".`,
        }).toStrictEqual(normalise(expected));
      },
    };
  };
