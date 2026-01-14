import { afterEach, describe, expect, it } from "vitest";

import { CucumberRunner } from "../cucumber-runner";
import {
	getCurrentRunnerSteps,
	setCurrentRunnerSteps,
	clearCurrentRunnerSteps,
} from "../current";

describe("current runner steps registry", () => {
	afterEach(() => {
		clearCurrentRunnerSteps();
	});

	it("throws when steps surface has not been registered", () => {
		expect(() => getCurrentRunnerSteps()).toThrow(
			"Runner steps surface has not been configured. Call setCurrentRunnerSteps() before accessing the shared runner surface."
		);
	});

	it("returns the registered steps surface", () => {
		const builder = CucumberRunner.builder<{ value: number }>();
		const steps = builder.steps();

		setCurrentRunnerSteps(steps);

		expect(
			getCurrentRunnerSteps<{ value: number }>()
		).toBe(steps);

		clearCurrentRunnerSteps();

		expect(() => getCurrentRunnerSteps()).toThrow(
			"Runner steps surface has not been configured. Call setCurrentRunnerSteps() before accessing the shared runner surface."
		);
	});

	it("mirrors static set/clear helpers", () => {
		const steps = CucumberRunner.builder<{ id: string }>().steps();
		CucumberRunner.setSteps(steps);
		expect(CucumberRunner.steps<{ id: string }>()).toBe(steps);
		CucumberRunner.clearSteps();
		expect(() => CucumberRunner.steps()).toThrow(
			"Runner steps surface has not been configured. Call setCurrentRunnerSteps() before accessing the shared runner surface."
		);
	});
});
