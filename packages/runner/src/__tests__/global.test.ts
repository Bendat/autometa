import { afterEach, describe, expect, it } from "vitest";

import { createRunner } from "../dsl/create-runner";
import {
	configureGlobalRunner,
	disposeGlobalRunner,
	getConfiguredGlobalRunner,
	getGlobalRunner,
	getGlobalRunnerEnvironment,
	resetGlobalRunner,
	useGlobalRunnerEnvironment,
} from "../global";
import type { GlobalWorld } from "../global";

describe("global runner helpers", () => {
	afterEach(() => {
		disposeGlobalRunner();
	});

	it("requires configuration before access", () => {
		expect(() => getConfiguredGlobalRunner()).toThrow(
			"Global runner has not been configured. Call configureGlobalRunner() before accessing runner APIs."
		);
		expect(() =>
			useGlobalRunnerEnvironment(createRunner<GlobalWorld>())
		).toThrow(
			"Global runner has not been configured. Call configureGlobalRunner() before injecting environments."
		);
	});

	it("lazily instantiates and reuses runner instances", () => {
		const first = getGlobalRunner();
		const second = getGlobalRunner();
		expect(second).toBe(first);

		const configured = configureGlobalRunner({
			registerDefaultParameterTypes: false,
		});
		expect(configured).not.toBe(first);
		expect(getGlobalRunner()).toBe(configured);
	});

	it("mirrors injected environments", () => {
		const environment = createRunner<GlobalWorld>({
			registerDefaultParameterTypes: false,
		});
		environment.defineParameterType({
			name: "greeting",
			pattern: /hello/,
			transform: (value: unknown) => String(value ?? ""),
		});

		getGlobalRunner();
		useGlobalRunnerEnvironment(environment);

		expect(getGlobalRunnerEnvironment()).toBe(environment);
		expect(getConfiguredGlobalRunner().parameterRegistry).toBe(
			environment.parameterRegistry
		);
		expect(getConfiguredGlobalRunner().lookupParameterType("greeting")).toBeDefined();
	});

	it("resets to a fresh runner instance", () => {
		const first = getGlobalRunner();
		const firstEnvironment = getGlobalRunnerEnvironment();

		const reset = resetGlobalRunner();
		const secondEnvironment = getGlobalRunnerEnvironment();

		expect(reset).not.toBe(first);
		expect(secondEnvironment).not.toBe(firstEnvironment);
	});
});
