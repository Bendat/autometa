import type {
	DecoratorFeatureDescriptor,
	DecoratorRuleDescriptor,
	DecoratorScenarioDescriptor,
	HookHandler,
	HookOptions,
	HookType,
	ScopeRegistrationOptions,
	StepExpression,
	StepHandler,
	StepKeyword,
	StepOptions,
} from "@autometa/scopes";

import type { DecoratorRegistrationApi } from "../dsl/decorator-shared";

interface FeatureDecoratorOptions
	extends Partial<Omit<DecoratorFeatureDescriptor, "name">> {
	readonly name?: string;
}

interface RuleDecoratorOptions
	extends Partial<Omit<DecoratorRuleDescriptor, "name">> {
	readonly name: string;
}

interface ScenarioDecoratorOptions
	extends Partial<Omit<DecoratorScenarioDescriptor, "name">> {
	readonly name: string;
	readonly steps?: readonly PropertyKey[];
	readonly rule?: PropertyKey;
}

interface StepDecoratorOptions extends StepOptions {
	readonly scenario: PropertyKey | readonly PropertyKey[];
}

interface ScenarioHookDecoratorOptions extends HookOptions {
	readonly scenario: PropertyKey | readonly PropertyKey[];
	readonly description?: string;
}

interface FeatureHookDecoratorOptions extends HookOptions {
	readonly description?: string;
}

interface RuleHookDecoratorOptions extends HookOptions {
	readonly rule: PropertyKey | readonly PropertyKey[];
	readonly description?: string;
}

interface StepMetadata<World> {
	readonly keyword: StepKeyword;
	readonly expression: StepExpression;
	readonly handler: StepHandler<World>;
	readonly options?: StepOptions;
}

interface HookMetadata<World> {
	readonly handler: HookHandler<World>;
	readonly options?: HookOptions;
}

interface HookRef {
	readonly propertyKey: PropertyKey;
	readonly type: HookType;
	readonly description?: string;
	readonly options?: HookOptions;
}


interface ScenarioRecord {
	readonly token: unknown;
	readonly descriptor: DecoratorScenarioDescriptor;
	readonly steps: Set<PropertyKey>;
	readonly hooks: HookRef[];
	readonly ruleKey?: PropertyKey;
		ruleToken?: unknown;
}

interface PendingScenarioData {
	readonly steps: Set<PropertyKey>;
	readonly hooks: HookRef[];
}

interface RuleRecord {
	readonly token: unknown;
	readonly descriptor: DecoratorRuleDescriptor;
	readonly hooks: HookRef[];
	readonly scenarios: Set<PropertyKey>;
}

interface PendingRuleData {
	readonly scenarios: Set<PropertyKey>;
	readonly hooks: HookRef[];
}

type FeatureConstructor = abstract new (...args: never[]) => unknown;
type Mutable<T> = { -readonly [P in keyof T]: T[P] };

export interface RunnerDecorators<_World> {
	Feature(options?: FeatureDecoratorOptions): ClassDecorator;
	Rule(options: RuleDecoratorOptions): MethodDecorator;
	Scenario(options: ScenarioDecoratorOptions): MethodDecorator;
	Given(
		expression: StepExpression,
		options: StepDecoratorOptions
	): MethodDecorator;
	When(
		expression: StepExpression,
		options: StepDecoratorOptions
	): MethodDecorator;
	Then(
		expression: StepExpression,
		options: StepDecoratorOptions
	): MethodDecorator;
	And(
		expression: StepExpression,
		options: StepDecoratorOptions
	): MethodDecorator;
	But(
		expression: StepExpression,
		options: StepDecoratorOptions
	): MethodDecorator;
	BeforeFeature(options?: FeatureHookDecoratorOptions): MethodDecorator;
	AfterFeature(options?: FeatureHookDecoratorOptions): MethodDecorator;
	BeforeRule(options: RuleHookDecoratorOptions): MethodDecorator;
	AfterRule(options: RuleHookDecoratorOptions): MethodDecorator;
	BeforeScenario(options: ScenarioHookDecoratorOptions): MethodDecorator;
	AfterScenario(options: ScenarioHookDecoratorOptions): MethodDecorator;
	BeforeScenarioOutline(options: ScenarioHookDecoratorOptions): MethodDecorator;
	AfterScenarioOutline(options: ScenarioHookDecoratorOptions): MethodDecorator;
}

export function createRunnerDecorators<World>(
	environment: DecoratorRegistrationApi<World>
): RunnerDecorators<World> {
	const stepMetadata = new WeakMap<object, Map<PropertyKey, StepMetadata<World>>>();
	const hookMetadata = new WeakMap<object, Map<PropertyKey, HookMetadata<World>>>();
	const scenarioRecords = new WeakMap<FeatureConstructor, Map<PropertyKey, ScenarioRecord>>();
	const pendingScenarioData = new WeakMap<FeatureConstructor, Map<PropertyKey, PendingScenarioData>>();
	const ruleRecords = new WeakMap<FeatureConstructor, Map<PropertyKey, RuleRecord>>();
	const pendingRuleData = new WeakMap<FeatureConstructor, Map<PropertyKey, PendingRuleData>>();
	const featureHooks = new WeakMap<FeatureConstructor, HookRef[]>();

	function getOrCreateRecordMap(constructor: FeatureConstructor) {
		let records = scenarioRecords.get(constructor);
		if (!records) {
			records = new Map();
			scenarioRecords.set(constructor, records);
		}
		return records;
	}

	function getOrCreatePending(constructor: FeatureConstructor) {
		let pending = pendingScenarioData.get(constructor);
		if (!pending) {
			pending = new Map();
			pendingScenarioData.set(constructor, pending);
		}
		return pending;
	}

	function getOrCreateRuleRecordMap(constructor: FeatureConstructor) {
		let records = ruleRecords.get(constructor);
		if (!records) {
			records = new Map();
			ruleRecords.set(constructor, records);
		}
		return records;
	}

	function getOrCreateRulePending(constructor: FeatureConstructor) {
		let pending = pendingRuleData.get(constructor);
		if (!pending) {
			pending = new Map();
			pendingRuleData.set(constructor, pending);
		}
		return pending;
	}

	function addStepAssociation(
		constructor: FeatureConstructor,
		scenarioKey: PropertyKey,
		stepKey: PropertyKey
	) {
		const records = scenarioRecords.get(constructor);
		const record = records?.get(scenarioKey);
		if (record) {
			record.steps.add(stepKey);
			return;
		}

		const pending = getOrCreatePending(constructor);
		let entry = pending.get(scenarioKey);
		if (!entry) {
			entry = { steps: new Set(), hooks: [] };
			pending.set(scenarioKey, entry);
		}
		entry.steps.add(stepKey);
	}

	function addHookAssociation(
		constructor: FeatureConstructor,
		scenarioKey: PropertyKey,
		hook: HookRef
	) {
		const records = scenarioRecords.get(constructor);
		const record = records?.get(scenarioKey);
		if (record) {
			record.hooks.push(hook);
			return;
		}

		const pending = getOrCreatePending(constructor);
		let entry = pending.get(scenarioKey);
		if (!entry) {
			entry = { steps: new Set(), hooks: [] };
			pending.set(scenarioKey, entry);
		}
		entry.hooks.push(hook);
	}

	function addRuleScenarioAssociation(
		constructor: FeatureConstructor,
		ruleKey: PropertyKey,
		scenarioKey: PropertyKey
	) {
		const records = ruleRecords.get(constructor);
		const record = records?.get(ruleKey);
		if (record) {
			record.scenarios.add(scenarioKey);
			return record.token;
		}

		const pending = getOrCreateRulePending(constructor);
		let entry = pending.get(ruleKey);
		if (!entry) {
			entry = { scenarios: new Set(), hooks: [] };
			pending.set(ruleKey, entry);
		}
		entry.scenarios.add(scenarioKey);
		return undefined;
	}

	function addRuleHookAssociation(
		constructor: FeatureConstructor,
		ruleKey: PropertyKey,
		hook: HookRef
	) {
		const records = ruleRecords.get(constructor);
		const record = records?.get(ruleKey);
		if (record) {
			record.hooks.push(hook);
			return;
		}

		const pending = getOrCreateRulePending(constructor);
		let entry = pending.get(ruleKey);
		if (!entry) {
			entry = { scenarios: new Set(), hooks: [] };
			pending.set(ruleKey, entry);
		}
		entry.hooks.push(hook);
	}

	function recordFeatureHook(constructor: FeatureConstructor, hook: HookRef) {
		const hooks = featureHooks.get(constructor);
		if (hooks) {
			hooks.push(hook);
			return;
		}
		featureHooks.set(constructor, [hook]);
	}

	function recordStepMetadata(
		target: object,
		propertyKey: PropertyKey,
		metadata: StepMetadata<World>
	) {
		let map = stepMetadata.get(target);
		if (!map) {
			map = new Map();
			stepMetadata.set(target, map);
		}
		map.set(propertyKey, metadata);
	}

	function recordHookMetadata(
		target: object,
		propertyKey: PropertyKey,
		metadata: HookMetadata<World>
	) {
		let map = hookMetadata.get(target);
		if (!map) {
			map = new Map();
			hookMetadata.set(target, map);
		}
		map.set(propertyKey, metadata);
	}

	function getStepMetadata(
		target: object,
		propertyKey: PropertyKey
	): StepMetadata<World> | undefined {
		return stepMetadata.get(target)?.get(propertyKey);
	}

	function getHookMetadata(
		target: object,
		propertyKey: PropertyKey
	): HookMetadata<World> | undefined {
		return hookMetadata.get(target)?.get(propertyKey);
	}

	function normalizeSteps(value: readonly PropertyKey[] | undefined) {
		return value ? new Set(value) : new Set<PropertyKey>();
	}

	function isReadonlyArray<T>(value: T | readonly T[]): value is readonly T[] {
		return Array.isArray(value);
	}

	function toArray<T>(input: T | readonly T[]): readonly T[] {
		return isReadonlyArray(input) ? input : ([input] as const);
	}

	function buildStepOptions(options: StepDecoratorOptions): StepOptions | undefined {
		const candidate: Partial<Mutable<StepOptions>> = {};
		if (options.tags) {
			candidate.tags = [...options.tags] as readonly string[];
		}
		if (options.timeout !== undefined) {
			candidate.timeout = options.timeout;
		}
		if (options.mode) {
			candidate.mode = options.mode;
		}
		if (options.data) {
			candidate.data = { ...options.data };
		}
		return Object.keys(candidate).length > 0
			? (candidate as StepOptions)
			: undefined;
	}

	function buildHookOptions<T extends HookOptions>(options: T): HookOptions | undefined {
		const candidate: Partial<Mutable<HookOptions>> = {};
		if (options.tags) {
			candidate.tags = [...options.tags] as readonly string[];
		}
		if (options.timeout !== undefined) {
			candidate.timeout = options.timeout;
		}
		if (options.order !== undefined) {
			candidate.order = options.order;
		}
		if (options.mode) {
			candidate.mode = options.mode;
		}
		if (options.data) {
			candidate.data = { ...options.data };
		}
		return Object.keys(candidate).length > 0
			? (candidate as HookOptions)
			: undefined;
	}

	function cloneScopeOptions(options: ScopeRegistrationOptions) {
		const {
			tags,
			description,
			timeout,
			mode,
			source,
			data,
			examples,
		} = options;

		return {
			...(tags ? { tags: [...tags] } : {}),
			...(description !== undefined ? { description } : {}),
			...(timeout !== undefined
				? {
					timeout:
						typeof timeout === "number"
							? timeout
							: { ...timeout },
				}
			: {}),
			...(mode !== undefined ? { mode } : {}),
			...(source ? { source: { ...source } } : {}),
			...(data ? { data: { ...data } } : {}),
			...(examples
				? {
					examples: examples.map((example) => ({
						...example,
						...(example.tags ? { tags: [...example.tags] } : {}),
						table: example.table.map((row) => [...row]),
					})),
				}
				: {}),
		};
	}

	function Feature(options: FeatureDecoratorOptions = {}): ClassDecorator {
		return (target) => {
			const constructor = target as unknown as FeatureConstructor;
			const descriptor: DecoratorFeatureDescriptor = {
				name: options.name ?? constructor.name ?? "Feature",
				...cloneScopeOptions(options),
			};

			environment.feature(constructor, descriptor);

			const featureHookRefs = featureHooks.get(constructor);
			if (featureHookRefs) {
				for (const hook of featureHookRefs) {
					const metadata =
						getHookMetadata(constructor.prototype, hook.propertyKey) ??
						getHookMetadata(constructor, hook.propertyKey);
					if (!metadata) {
						throw new Error(
							`Hook metadata missing for ${String(hook.propertyKey)} on feature ${descriptor.name}`
						);
					}
					environment.hook(
						constructor,
						hook.type,
						metadata.handler,
						hook.description,
						hook.options ?? metadata.options
					);
				}
				featureHooks.delete(constructor);
			}

			const rules = ruleRecords.get(constructor);
			if (rules) {
				for (const [ruleKey, ruleRecord] of rules.entries()) {
					environment.rule(constructor, ruleRecord.token, ruleRecord.descriptor);

					const hooks = ruleRecord.hooks;
					for (const hook of hooks) {
						const metadata =
							getHookMetadata(constructor.prototype, hook.propertyKey) ??
							getHookMetadata(constructor, hook.propertyKey);
						if (!metadata) {
							throw new Error(
								`Hook metadata missing for ${String(hook.propertyKey)} on rule ${String(ruleKey)} of feature ${descriptor.name}`
							);
						}
						environment.hook(
							ruleRecord.token,
							hook.type,
							metadata.handler,
							hook.description,
							hook.options ?? metadata.options
						);
					}
				}
			}

			const records = scenarioRecords.get(constructor);
			if (records) {
				for (const [scenarioKey, record] of records.entries()) {
					if (record.ruleKey) {
						const ruleRecord = rules?.get(record.ruleKey);
						if (!ruleRecord) {
							throw new Error(
								`Scenario ${record.descriptor.name} references unknown rule ${String(record.ruleKey)}`
							);
						}
						record.ruleToken = record.ruleToken ?? ruleRecord.token;
						ruleRecord.scenarios.add(scenarioKey);
					}
					environment.scenario(record.token, record.descriptor, {
						feature: constructor,
						...(record.ruleToken ? { rule: record.ruleToken } : {}),
					});

					for (const stepKey of record.steps) {
						const metadata =
							getStepMetadata(constructor.prototype, stepKey) ??
							getStepMetadata(constructor, stepKey);
						if (!metadata) {
							throw new Error(
								`Step metadata missing for ${String(stepKey)} on feature ${descriptor.name}`
							);
						}
						environment.step(
							record.token,
							metadata.keyword,
							metadata.expression,
							metadata.handler,
							metadata.options
						);
					}

					for (const hook of record.hooks) {
						const metadata =
							getHookMetadata(constructor.prototype, hook.propertyKey) ??
							getHookMetadata(constructor, hook.propertyKey);
						if (!metadata) {
							throw new Error(
								`Hook metadata missing for ${String(hook.propertyKey)} on feature ${descriptor.name}`
							);
						}
						environment.hook(
							record.token,
							hook.type,
							metadata.handler,
							hook.description,
							hook.options ?? metadata.options
						);
					}
				}

				scenarioRecords.delete(constructor);
			}

			ruleRecords.delete(constructor);
			pendingRuleData.delete(constructor);
			pendingScenarioData.delete(constructor);
		};
	}

	function Rule(options: RuleDecoratorOptions): MethodDecorator {
		return (target, propertyKey) => {
			const constructor = resolveConstructor(target);
			const descriptor: DecoratorRuleDescriptor = {
				name: options.name,
				...cloneScopeOptions(options),
			};

			const records = getOrCreateRuleRecordMap(constructor);
			if (records.has(propertyKey)) {
				throw new Error(`Rule ${String(propertyKey)} already registered on feature ${constructor.name}`);
			}

			const token = Symbol(`rule:${String(propertyKey)}`);
			const record: RuleRecord = {
				token,
				descriptor,
				hooks: [],
				scenarios: new Set(),
			};

			const pending = pendingRuleData.get(constructor)?.get(propertyKey);
			if (pending) {
				for (const scenarioKey of pending.scenarios) {
					record.scenarios.add(scenarioKey);
				}
				record.hooks.push(...pending.hooks);
				pendingRuleData.get(constructor)?.delete(propertyKey);
			}

			records.set(propertyKey, record);

			const scenarios = scenarioRecords.get(constructor);
			if (scenarios) {
				for (const scenarioKey of record.scenarios) {
					const scenarioRecord = scenarios.get(scenarioKey);
					if (scenarioRecord) {
						scenarioRecord.ruleToken = token;
					}
				}
			}
		};
	}

	function Scenario(options: ScenarioDecoratorOptions): MethodDecorator {
		return (target, propertyKey) => {
			const constructor = resolveConstructor(target);
			const records = getOrCreateRecordMap(constructor);

			const descriptor: DecoratorScenarioDescriptor = {
				name: options.name,
				kind: options.kind ?? "scenario",
				...cloneScopeOptions(options),
			};

			const token = Symbol(`scenario:${String(propertyKey)}`);
			const steps = normalizeSteps(options.steps);
			const hooks: HookRef[] = [];
			const ruleKey = options.rule;
			let ruleToken: unknown | undefined;
			if (ruleKey !== undefined) {
				ruleToken = addRuleScenarioAssociation(constructor, ruleKey, propertyKey);
			}

			const pending = pendingScenarioData.get(constructor)?.get(propertyKey);
			if (pending) {
				for (const stepKey of pending.steps) {
					steps.add(stepKey);
				}
				hooks.push(...pending.hooks);
				pendingScenarioData.get(constructor)?.delete(propertyKey);
			}

			const record: ScenarioRecord = {
				token,
				descriptor,
				steps,
				hooks,
				...(ruleKey !== undefined ? { ruleKey } : {}),
				...(ruleToken ? { ruleToken } : {}),
			};

			records.set(propertyKey, record);
		};
	}

	function createStepDecorator(keyword: StepKeyword) {
		return (
			expression: StepExpression,
			options: StepDecoratorOptions
		): MethodDecorator => {
			if (!options || !options.scenario) {
				throw new Error("Step decorator requires a scenario property key");
			}

			const scenarioRefs = toArray(options.scenario);
			const stepOptions = buildStepOptions(options);

			return (target, propertyKey, descriptor) => {
				const handler = descriptor?.value as StepHandler<World> | undefined;
				if (typeof handler !== "function") {
					throw new Error(
						`Step decorator can only be applied to methods. ${String(propertyKey)} is not a function.`
					);
				}

				recordStepMetadata(target, propertyKey, {
					keyword,
					expression,
					handler,
					...(stepOptions ? { options: stepOptions } : {}),
				});

				const constructor = resolveConstructor(target);
				for (const scenarioKey of scenarioRefs) {
					addStepAssociation(constructor, scenarioKey, propertyKey);
				}
			};
		};
	}

	function createScenarioHookDecorator(type: HookType) {
		return (options: ScenarioHookDecoratorOptions): MethodDecorator => {
			if (!options || !options.scenario) {
				throw new Error("Hook decorator requires a scenario property key");
			}
			const scenarioRefs = toArray(options.scenario);
			const hookOptions = buildHookOptions(options);
			const description = options.description;

			return (target, propertyKey, descriptor) => {
				const handler = descriptor?.value as HookHandler<World> | undefined;
				if (typeof handler !== "function") {
					throw new Error(
						`Hook decorator can only be applied to methods. ${String(propertyKey)} is not a function.`
					);
				}

				recordHookMetadata(target, propertyKey, {
					handler,
					...(hookOptions ? { options: hookOptions } : {}),
				});

				const constructor = resolveConstructor(target);
				const hookRef: HookRef = {
					propertyKey,
					type,
					...(description ? { description } : {}),
					...(hookOptions ? { options: hookOptions } : {}),
				};

				for (const scenarioKey of scenarioRefs) {
					addHookAssociation(constructor, scenarioKey, hookRef);
				}
			};
		};
	}

	function createRuleHookDecorator(type: HookType) {
		return (options: RuleHookDecoratorOptions): MethodDecorator => {
			if (!options || !options.rule) {
				throw new Error("Rule hook decorator requires a rule property key");
			}

			const ruleRefs = toArray(options.rule);
			const hookOptions = buildHookOptions(options);
			const description = options.description;

			return (target, propertyKey, descriptor) => {
				const handler = descriptor?.value as HookHandler<World> | undefined;
				if (typeof handler !== "function") {
					throw new Error(
						`Hook decorator can only be applied to methods. ${String(propertyKey)} is not a function.`
					);
				}

				recordHookMetadata(target, propertyKey, {
					handler,
					...(hookOptions ? { options: hookOptions } : {}),
				});

				const constructor = resolveConstructor(target);
				const hookRef: HookRef = {
					propertyKey,
					type,
					...(description ? { description } : {}),
					...(hookOptions ? { options: hookOptions } : {}),
				};

				for (const ruleKey of ruleRefs) {
					addRuleHookAssociation(constructor, ruleKey, hookRef);
				}
			};
		};
	}

	function createFeatureHookDecorator(type: HookType) {
		return (
			options: FeatureHookDecoratorOptions = {}
		): MethodDecorator => {
			const hookOptions = buildHookOptions(options);
			const description = options.description;

			return (target, propertyKey, descriptor) => {
				const handler = descriptor?.value as HookHandler<World> | undefined;
				if (typeof handler !== "function") {
					throw new Error(
						`Hook decorator can only be applied to methods. ${String(propertyKey)} is not a function.`
					);
				}

				recordHookMetadata(target, propertyKey, {
					handler,
					...(hookOptions ? { options: hookOptions } : {}),
				});

				const constructor = resolveConstructor(target);
				const hookRef: HookRef = {
					propertyKey,
					type,
					...(description ? { description } : {}),
					...(hookOptions ? { options: hookOptions } : {}),
				};

				recordFeatureHook(constructor, hookRef);
			};
		};
	}

	function resolveConstructor(target: object): FeatureConstructor {
		const ctor = (target as { constructor?: unknown }).constructor;
		if (typeof ctor !== "function") {
			throw new Error("Decorated target does not expose a constructor");
		}
		return ctor as unknown as FeatureConstructor;
	}

	return {
		Feature,
		Rule,
		Scenario,
		Given: createStepDecorator("Given"),
		When: createStepDecorator("When"),
		Then: createStepDecorator("Then"),
		And: createStepDecorator("And"),
		But: createStepDecorator("But"),
		BeforeFeature: createFeatureHookDecorator("beforeFeature"),
		AfterFeature: createFeatureHookDecorator("afterFeature"),
		BeforeRule: createRuleHookDecorator("beforeRule"),
		AfterRule: createRuleHookDecorator("afterRule"),
		BeforeScenario: createScenarioHookDecorator("beforeScenario"),
		AfterScenario: createScenarioHookDecorator("afterScenario"),
		BeforeScenarioOutline: createScenarioHookDecorator("beforeScenarioOutline"),
		AfterScenarioOutline: createScenarioHookDecorator("afterScenarioOutline"),
	};
}
