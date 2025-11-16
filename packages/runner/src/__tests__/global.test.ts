import { describe, expect, it } from "vitest";

import {
	And,
	But,
	Feature,
	Given,
	Scenario,
	Then,
	When,
	configureGlobalRunner,
	globalRunner,
	lookupParameterType,
	useGlobalRunnerEnvironment,
} from "../global";
import { createRunner } from "../dsl/create-runner";

describe("global runner exports", () => {
	it("registers steps using the standalone step functions", () => {
		configureGlobalRunner();

		Feature("Feature", () => {
			Scenario("Scenario", () => {
				Given("a precondition", () => undefined);
				When("an action occurs", () => undefined);
				Then("an assertion holds", () => undefined);
				And("a follow up step", () => undefined);
				But("an exception does not happen", () => undefined);
			});
		});

		const plan = globalRunner.getPlan();
		const feature = plan.root.children[0];
		const scenario = feature?.children[0];
		expect(scenario?.steps).toHaveLength(5);
	});

	it("reflects injected environments through exported helpers", () => {
		const environment = createRunner({ registerDefaultParameterTypes: false });
		useGlobalRunnerEnvironment(environment);

		expect(lookupParameterType("int")).toBeUndefined();

		configureGlobalRunner();
	});
});
