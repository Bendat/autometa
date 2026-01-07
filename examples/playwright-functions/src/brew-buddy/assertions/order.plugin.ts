import type { AssertionPlugin } from "@autometa/assertions";

import type { Order, OrderItem } from "../../../../.api/src/types/domain.js";

import {
	formatOrderItemPreferenceLabel,
	getOrderItemPreference,
	normalizeOrderPreference,
} from "../capabilities/orders/order-preferences";

export interface OrderAssertions {
	current(): Order;
	item(index?: number): OrderItem;
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
	({ ensure, isNot }) =>
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

		return {
			current() {
				return requireOrder();
			},
			item(index) {
				return requireItem(index);
			},
			milkIs(expected) {
				const item = requireItem(0);
				const preference = getOrderItemPreference(item, "milk");
				ensure(preference.normalized, {
					label: formatOrderItemPreferenceLabel({
						kind: "milk",
						expected,
						actualRaw: preference.raw,
						actualNormalized: preference.normalized,
						isNot,
					}),
				}).toStrictEqual(normalizeOrderPreference(expected));
			},
			sweetenerIs(expected) {
				const item = requireItem(0);
				const preference = getOrderItemPreference(item, "sweetener");
				ensure(preference.normalized, {
					label: formatOrderItemPreferenceLabel({
						kind: "sweetener",
						expected,
						actualRaw: preference.raw,
						actualNormalized: preference.normalized,
						isNot,
					}),
				}).toStrictEqual(normalizeOrderPreference(expected));
			},
		};
	};
