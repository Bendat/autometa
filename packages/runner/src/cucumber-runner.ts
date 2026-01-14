import type {
	CucumberExpressionTypeMap,
	DefaultCucumberExpressionTypes,
} from "@autometa/scopes";

import {
	createRunnerBuilder,
	type RunnerBuilder,
	type RunnerStepsSurface,
} from "./builder/create-runner-builder";
import type { RunnerContextOptions } from "./core/runner-context";
import {
	clearCurrentRunnerSteps,
	getCurrentRunnerSteps,
	setCurrentRunnerSteps,
} from "./current";

export class CucumberRunner {
	static builder<
		World,
		ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
	>(
		initial?: Partial<RunnerContextOptions<World>>
	): RunnerBuilder<World, ExpressionTypes> {
		return createRunnerBuilder<World, ExpressionTypes>(initial);
	}

	static setSteps<
		World,
		ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
	>(steps: RunnerStepsSurface<World, ExpressionTypes>): void {
		setCurrentRunnerSteps(steps);
	}

	static steps<
		World,
		ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
	>(): RunnerStepsSurface<World, ExpressionTypes> {
		return getCurrentRunnerSteps<World, ExpressionTypes>();
	}

	static clearSteps(): void {
		clearCurrentRunnerSteps();
	}
}
