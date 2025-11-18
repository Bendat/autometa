import type {
	CucumberExpressionTypeMap,
	DefaultCucumberExpressionTypes,
} from "@autometa/scopes";

import { createRunnerBuilder, type RunnerBuilder } from "./builder/create-runner-builder";
import type { RunnerContextOptions } from "./core/runner-context";

export class CucumberRunner {
	static builder<
		World,
		ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
	>(
		initial?: Partial<RunnerContextOptions<World>>
	): RunnerBuilder<World, ExpressionTypes> {
		return createRunnerBuilder<World, ExpressionTypes>(initial);
	}
}
