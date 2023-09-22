import { Config } from "@autometa/config";
import { FeatureBridge, TestBuilder } from "@autometa/test-builder";
import { AutometaApp, AutometaWorld } from "@autometa/app";
import { TestEventEmitter } from "@autometa/events";
import { Class } from "@autometa/types";
import { FeatureScope, Files, GlobalScope } from "@autometa/scopes";
import { AutomationError } from "@autometa/errors";
import { AssertDefined } from "@autometa/asserters";
import { CoordinatorOpts } from "./types";
import { Feature } from "@autometa/gherkin";
export class Coordinator {
  #fs: Files;
  #builder: TestBuilder;
  #bridge: FeatureBridge;
  constructor(
    readonly global: GlobalScope,
    readonly configs: Config,
    readonly opts: Record<string, CoordinatorOpts>
  ) {
    AssertDefined(configs, "Config");
  }

  run(
    feature: FeatureScope,
    caller: string,
    events: TestEventEmitter,
    executor: (
      { app, world }: { app: Class<AutometaApp>; world: Class<AutometaWorld> },
      global: GlobalScope,
      bridge: FeatureBridge,
      events: TestEventEmitter,
      config: Config
    ) => void
  ) {
    AssertDefined(executor, "Executor");

    const fs = this.fileSystem(caller);
    const path = fs.fromUrlPattern(feature.path);
    path.loadApps();

    const gherkin = path.getFeatureFile();
    if (!Array.isArray(gherkin)) {
      this.start(gherkin, feature, events, executor);
    } else {
      for (const featGherkin of gherkin) {
        this.start(featGherkin, feature, events, executor);
      }
    }
  }

  private start(
    gherkin: Feature,
    feature: FeatureScope,
    events: TestEventEmitter,
    executor: (
      { app, world }: { app: Class<AutometaApp>; world: Class<AutometaWorld> },
      global: GlobalScope,
      bridge: FeatureBridge,
      events: TestEventEmitter,
      config: Config
    ) => void
  ) {
    this.global.unlock();
    this.loadSteps();
    this.global.lock();
    this.#builder = new TestBuilder(gherkin);
    this.#bridge = this.#builder.onFeatureExecuted(feature);
    const { app, world } = this.opts[this.config.environment ?? "default"];
    executor({ app, world }, this.global, this.#bridge, events, this.configs);
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

  fileSystem(caller: string) {
    const { roots } = this.config;
    const { steps, features, app } = roots;

    this.#fs = new Files()
      .withFeatureRoot(features)
      .withCallerFile(caller)
      .withStepsRoot(steps)
      .withAppRoot(app);
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
