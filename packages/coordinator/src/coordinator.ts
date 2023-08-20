import { Config } from "@autometa/config";
import { FeatureBridge, TestBuilder } from "@autometa/test-builder";
import { AutometaApp, AutometaWorld } from "@autometa/app";
import { TestEventEmitter } from "@autometa/events";
import { Class } from "@autometa/types";
import { FeatureScope, Files } from "@autometa/scopes";
import { AutomationError } from "@autometa/errors";
import { AssertDefined } from "@autometa/asserters";
import { CoordinatorOpts } from "./types";
export class Coordinator {
  #fs: Files;
  #builder: TestBuilder;
  #bridge: FeatureBridge;
  constructor(
    readonly configs: Config,
    readonly feature: FeatureScope,
    readonly callerFile: string,
    readonly events: TestEventEmitter,
    readonly opts: CoordinatorOpts,
    readonly executor: (
      { app, world }: { app: Class<AutometaApp>; world: Class<AutometaWorld> },
      bridge: FeatureBridge,
      events: TestEventEmitter
    ) => void
  ) {
    AssertDefined(configs, "Config");
    AssertDefined(feature, "Feature");
    AssertDefined(executor, "Executor");
    const fs = this.fileSystem();
    const path = fs.fromUrlPattern(feature.path);
    const gherkin = path.getFeatureFile();
    this.#builder = new TestBuilder(gherkin);
    this.#bridge = this.#builder.onFeatureExecuted(feature);
    this.loadSteps();
    const { app, world } = this.opts;
    executor({ app, world }, this.#bridge, this.events);
  }

  get fs() {
    if (!this.#fs) {
      throw new AutomationError("File System not initialized");
    }
    return this.#fs;
  }

  get config() {
    return this.configs.current;
  }

  fileSystem() {
    const { roots } = this.config;
    const {
      steps,
      features
    }: { steps: string | string[]; features: string | string[] } = roots;

    this.#fs = new Files()
      .withFeatureRoot(features)
      .withCallerFile(this.callerFile)
      .withStepsRoot(steps);
    return this.fs;
  }

  loadSteps() {
    const { steps } = this.config.roots;
    if (typeof steps === "string") {
      this.fs.fromUrlPattern(steps).loadStepDefinitions();
      return;
    }
    for (const stepRoot of steps) {
      this.fs.fromUrlPattern(stepRoot).loadStepDefinitions();
    }
  }
}
