import type { AssertionPlugin } from "@autometa/assertions";

import type { Order, OrderItem } from "../../../../.api/src/types/domain.js";

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

		const normalise = (value: unknown): string => String(value ?? "").trim().toLowerCase();

		const preferenceLabel = (args: {
			readonly kind: "milk" | "sweetener";
			readonly expected: string;
			readonly actualRaw: string;
			readonly actualNormalised: string;
		}): string => {
			const notText = isNot ? " not" : "";
			const expectedNormalised = normalise(args.expected);

			// We include both raw and normalised values because domain inputs often
			// come from tables/docstrings and may include casing/whitespace.
			return [
				`order item ${args.kind} preference`,
				`(expected${notText}: "${args.expected}" → "${expectedNormalised}")`,
				`(actual: "${args.actualRaw}" → "${args.actualNormalised}")`,
			].join(" ");
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
				const actual = item.milk ?? "";
				const actualNormalised = normalise(actual);
				ensure(actualNormalised, {
					label: preferenceLabel({
						kind: "milk",
						expected,
						actualRaw: actual,
						actualNormalised,
					}),
				}).toStrictEqual(normalise(expected));
			},
			sweetenerIs(expected) {
				const item = requireItem(0);
				const actual = item.sweetener ?? "";
				const actualNormalised = normalise(actual);
				ensure(actualNormalised, {
					label: preferenceLabel({
						kind: "sweetener",
						expected,
						actualRaw: actual,
						actualNormalised,
					}),
				}).toStrictEqual(normalise(expected));
			},
		};
	};
