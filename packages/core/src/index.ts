// Root, curated exports for common usage.

// Assertions
export {
  ensure,
  EnsureError,
  createDefaultEnsureFactory,
  createEnsureFactory,
  runtimeAssertionsPlugin,
} from "@autometa/assertions";
export type {
  EnsureChain,
  EnsureOptions,
  EnsurePluginFacets,
  AssertionPlugin,
  AssertionPluginContext,
  EnsureFacade,
  EnsureFactory,
  EnsureInvoke,
  EnsureInvokeWithAlways,
  EnsureInvoker,
  RuntimeAssertions,
} from "@autometa/assertions";

// HTTP
export {
  HTTP,
  HTTPRequest,
  HTTPResponse,
  SchemaMap,
  ensureHttp,
  httpAssertionsPlugin,
  createFetchTransport,
  createAxiosTransport,
  transformResponse,
} from "@autometa/http";
export type {
  HTTPCreateOptions,
  HTTPError,
  HTTPTransportError,
  HTTPSchemaValidationError,
  HeaderPrimitive,
  HeaderFactory,
  ParamValue,
  ParamDictionary,
  RequestConfigBasic,
  HTTPRequestContext,
  HTTPResponseContext,
  HTTPErrorContext,
  HTTPLogEvent,
  HTTPLogSink,
  HTTPTransport,
  HTTPTransportResponse,
  HttpAssertionsFacet,
  HttpEnsureChain,
  HttpResponseLike,
  StatusExpectation,
  HeaderExpectation,
  CacheControlExpectation,
  FetchLike,
  FetchRequestOptions,
  AxiosLike,
  AxiosRequestConfigLike,
  AxiosResponseLike,
  HTTPAdditionalOptions,
  HTTPMethod,
  SchemaParser,
  RequestHook,
  ResponseHook,
  StatusCode,
  HTTPRetryOptions,
  HTTPRetryPredicate,
  HTTPRetryContext,
} from "@autometa/http";

// Config
export { Config, defineConfig, EnvironmentSelector } from "@autometa/config";
export {
  ExecutorConfigSchema,
  EventsSchema,
  PathSchema,
  PartialRootSchema,
  RootSchema,
  RunnerSchema,
  BuilderConfigSchema,
  ModuleFormatSchema,
  ShimSchema,
  TagFilterSchema,
  TestSchema,
  TimeUnitSchema,
  TimeoutSchema,
  PartialExecutorConfigSchema,
  ReporterSchema,
} from "@autometa/config";
export type {
  ConfigDefinition,
  ConfigDefinitionInput,
  ExecutorConfig,
  PartialExecutorConfig,
  BuilderConfig,
  BuilderHooks,
  PartialRootsConfig,
  ResolveOptions,
  ResolvedConfig,
  RootsConfig,
  ShimConfig,
  TestConfig,
  TimeoutSetting,
  ModuleFormat,
  BuildHook,
  BuildHookContext,
  SourceMapSetting,
  LoggingConfig,
  ReporterConfig,
} from "@autometa/config";

// Cucumber Expressions
export {
  createParameterTypes,
  defineParameterType,
  createDefaultParameterTypes,
  defineDefaultParameterTypes,
  attachTransform,
  applyCucumberExtensions,
  resetCucumberExtensions,
} from "@autometa/cucumber-expressions";
export type {
  ParameterTransformContext,
  ParameterTransformer,
  ParameterTypeDefinition,
  ParameterTypeDefinitions,
  CreateParameterTypesOptions,
  ParameterRuntime,
  ParameterTransformFn,
  CachedStep,
  StepDiff,
  StepDiffList,
  LimitedStepDiffs,
} from "@autometa/cucumber-expressions";

// Gherkin
export { 
  version as gherkinVersion,
  parseGherkin,
  astToSimple,
  GherkinParseError,
  simpleToAst,
  simpleToGherkin,
  QueryEngine,
  createQueryEngine,
  PickleGenerator,
  generatePickles,
  generatePickleById,
  generateId,
} from "@autometa/gherkin";
export type { ParseOptions } from "@autometa/gherkin";

// Executor helpers
export {
  resolveTimeout,
  chooseTimeout,
  TimeoutResolution,
  TimeoutSource,
  collectScenarioHooks,
  HookCollection,
  ResolvedHook,
  runScenarioExecution,
  ScenarioRunContext,
  registerFeaturePlan,
  ExecuteFeatureOptions,
  ScopeLifecycle,
  selectSuiteByMode,
  selectTestByMode,
  resolveModeFromTags,
  createTagFilter,
  ScenarioPendingError,
  isScenarioPendingError,
  Pending,
  ToDo,
  markScenarioPending,
  configureStepTables,
  resetStepTableConfig,
  configureStepDocstrings,
  resetStepDocstringConfig,
  setStepTable,
  clearStepTable,
  getTable,
  consumeTable,
  getRawTable,
  setStepDocstring,
  setStepDocstringInfo,
  clearStepDocstring,
  getDocstring,
  getDocstringMediaType,
  getDocstringInfo,
  consumeDocstring,
  setStepMetadata,
  clearStepMetadata,
  getStepMetadata,
  createStepRuntime,
  tryGetWorld,
  getWorld,
} from "@autometa/executor";
export type {
  HookLogEvent,
  HookLogListener,
  HookLogPathSegment,
  HookLogScenarioDetails,
  HookLogStepDetails,
  HookLogPhase,
  HookLifecycleMetadata,
  HookLifecycleScenarioMetadata,
  HookLifecycleStepMetadata,
  HookLifecycleTargetScopeMetadata,
  TagFilter,
  RawTable,
  DocstringInfo,
  DocstringTransformer,
  DocstringTransformConfig,
  StepRuntimeHelpers,
  StepRuntimeMetadata,
} from "@autometa/executor";

// Scopes
export {
  createScopes,
  ScopeComposer,
  createExecutionAdapter,
  DecoratorScopeRegistry,
} from "@autometa/scopes";

// Injection
export * from "@autometa/injection";

// Phrases
export * from "@autometa/phrases";

// Utilities
// For comprehensive type and error utilities, use subpath imports
// e.g., import { ... } from "@autometa/core/types" or "@autometa/core/errors"
export * from "@autometa/status-codes";
export * from "@autometa/datetime";
export * from "@autometa/dto-builder";
export * from "@autometa/bind-decorator";

// Note: Runner DSL is available under the subpath export only to keep root light.
