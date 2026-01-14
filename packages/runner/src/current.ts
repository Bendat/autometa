import type {
	RunnerStepsSurface,
} from "./builder/create-runner-builder";
import type {
	CucumberExpressionTypeMap,
	DefaultCucumberExpressionTypes,
} from "@autometa/scopes";

const stepsErrorMessage =
	"Runner steps surface has not been configured. Call setCurrentRunnerSteps() before accessing the shared runner surface.";

let currentSteps:
	| RunnerStepsSurface<unknown, CucumberExpressionTypeMap>
	| undefined;

export function setCurrentRunnerSteps<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
>(steps: RunnerStepsSurface<World, ExpressionTypes>): void {
	currentSteps =
		steps as RunnerStepsSurface<unknown, CucumberExpressionTypeMap>;
}

export function getCurrentRunnerSteps<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
>(): RunnerStepsSurface<World, ExpressionTypes> {
	if (!currentSteps) {
		throw new Error(stepsErrorMessage);
	}
	return currentSteps as RunnerStepsSurface<World, ExpressionTypes>;
}

export function clearCurrentRunnerSteps(): void {
	currentSteps = undefined;
}
