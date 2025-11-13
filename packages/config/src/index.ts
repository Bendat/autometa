export { Config, defineConfig } from "./config";
export { EnvironmentSelector } from "./environment-selector";
export {
	ExecutorConfigSchema,
	EventsSchema,
	PathSchema,
		PartialRootSchema,
	RootSchema,
	RunnerSchema,
	ShimSchema,
	TagFilterSchema,
	TestSchema,
	TimeUnitSchema,
	TimeoutSchema,
	PartialExecutorConfigSchema,
} from "./schema";
export type {
	ConfigDefinition,
	ConfigDefinitionInput,
	ExecutorConfig,
	PartialExecutorConfig,
		PartialRootsConfig,
	ResolveOptions,
	ResolvedConfig,
	RootsConfig,
	ShimConfig,
	TestConfig,
	TimeoutSetting,
} from "./types";