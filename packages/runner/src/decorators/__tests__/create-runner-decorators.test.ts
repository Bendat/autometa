import { describe, expect, it } from "vitest";
import type { HookType, ScopeNode } from "@autometa/scopes";

import { createDecoratorRunner } from "../../dsl/create-decorator-runner";
import { createRunnerDecorators } from "../create-runner-decorators";

describe("createRunnerDecorators", () => {
	it("registers decorated features, rules, scenarios, steps, and hooks", () => {
		interface World { value: number }

		const runner = createDecoratorRunner<World>();
		const decorators = createRunnerDecorators(runner);
		const {
			Feature,
			Rule,
			Scenario,
			Given,
			When,
			BeforeFeature,
			BeforeRule,
			BeforeScenario,
		} = decorators;

		class DecoratedFeature {
			ruleImplementation() {
				return undefined;
			}
			scenarioImplementation() {
				return undefined;
			}
			beforeFeatureHook() {
				return undefined;
			}
			beforeRuleHook() {
				return undefined;
			}
			beforeScenarioHook() {
				return undefined;
			}
			givenStep() {
				return undefined;
			}
			whenStep() {
				return undefined;
			}
			whenConcurrentStep() {
				return undefined;
			}
		}

		const applyMethodDecorator = (
			decorator: MethodDecorator,
			key: keyof DecoratedFeature
		) => {
			const descriptor = Object.getOwnPropertyDescriptor(
				DecoratedFeature.prototype,
				key
			);
			if (!descriptor) {
				throw new Error(`Descriptor missing for ${String(key)}`);
			}
			decorator(
				DecoratedFeature.prototype,
				key,
				descriptor as TypedPropertyDescriptor<DecoratedFeature[typeof key]>
			);
		};

		applyMethodDecorator(
			Rule({ name: "Decorated Rule" }),
			"ruleImplementation"
		);
		applyMethodDecorator(
			Scenario({ name: "Decorated Scenario", rule: "ruleImplementation" }),
			"scenarioImplementation"
		);
		applyMethodDecorator(
			Given("a decorated step", { scenario: "scenarioImplementation" }),
			"givenStep"
		);
		applyMethodDecorator(
			When.tags("@api")(
				"a tagged decorator step",
				{
					scenario: "scenarioImplementation",
					tags: ["@scenario"],
				}
			),
			"whenStep"
		);
		applyMethodDecorator(
			When.concurrent("a concurrent decorator step", {
				scenario: "scenarioImplementation",
			}),
			"whenConcurrentStep"
		);
		applyMethodDecorator(
			BeforeFeature(),
			"beforeFeatureHook"
		);
		applyMethodDecorator(
			BeforeRule({ rule: "ruleImplementation" }),
			"beforeRuleHook"
		);
		applyMethodDecorator(
			BeforeScenario({ scenario: "scenarioImplementation" }),
			"beforeScenarioHook"
		);

		Feature({ name: "Decorated Feature" })(DecoratedFeature);

		const plan = runner.buildPlan();
		const [feature] = plan.root.children;
		expect(feature?.name).toBe("Decorated Feature");

		const rule = feature?.children.find((child) => child.kind === "rule");
		expect(rule?.name).toBe("Decorated Rule");

		const scenario = rule?.children[0];
		expect(scenario?.name).toBe("Decorated Scenario");
		expect(scenario?.steps).toHaveLength(3);

		if (!feature || !rule || !scenario) {
			throw new Error("Decorated hierarchy not registered as expected");
		}

		const countHooks = (node: ScopeNode<World>, type: HookType) =>
			node.hooks.filter((hook) => hook.type === type).length;

		expect(countHooks(feature, "beforeFeature")).toBe(1);
		expect(countHooks(rule, "beforeRule")).toBe(1);
		expect(countHooks(scenario, "beforeScenario")).toBe(1);

		const taggedStep = scenario.steps.find(
			(step) => step.expression === "a tagged decorator step"
		);
		const givenStep = scenario.steps.find(
			(step) => step.expression === "a decorated step"
		);
		const concurrentStep = scenario.steps.find(
			(step) => step.expression === "a concurrent decorator step"
		);

		expect(taggedStep?.options.tags).toEqual(["@api", "@scenario"]);
		expect(givenStep?.options.tags).toEqual([]);
		expect(concurrentStep?.options.mode).toBe("concurrent");
	});
});
