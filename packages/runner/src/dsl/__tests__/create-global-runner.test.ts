import { describe, expect, it } from "vitest";

import { createGlobalRunner } from "../create-global-runner";
import { createRunner } from "../create-runner";
import { configureGlobalRunner } from "../../global";

describe("createGlobalRunner", () => {
	it("delegates DSL calls to the current environment", () => {
		interface World { value: number }

		const globals = createGlobalRunner<World>();

		globals.feature("Global Feature", () => {
			globals.scenario("Global Scenario", () => {
				globals.Given("a global step", () => undefined);
				globals.When("another global step", () => undefined);
				globals.Then("a final global step", () => undefined);
			});
		});

		const plan = globals.getPlan();
		expect(plan.root.children).toHaveLength(1);
		const feature = plan.root.children[0];
		expect(feature?.name).toBe("Global Feature");
		expect(feature?.children[0]?.steps).toHaveLength(3);
	});

	it("resets the underlying environment when requested", () => {
		const globals = createGlobalRunner();

		globals.defineParameterType({
			name: "greeting",
			pattern: /hello/,
			transform: (value: unknown) => String(value ?? ""),
		});

		expect(globals.lookupParameterType("greeting")).toBeDefined();

		globals.reset();

		expect(globals.lookupParameterType("greeting")).toBeUndefined();
	});

	it("allows injecting an external runner environment", () => {
		interface World {
			readonly greeting?: string;
		}
		const globals = createGlobalRunner<World>();
		const custom = createRunner<World>({ registerDefaultParameterTypes: false });

		custom.defineParameterType({
			name: "greeting",
			pattern: /hello/,
			transform: (value: unknown) => String(value ?? ""),
		});

		globals.useEnvironment(custom);
		expect(globals.getEnvironment()).toBe(custom);

		expect(globals.lookupParameterType("greeting")).toBeDefined();

		configureGlobalRunner();
	});
});
