import { ParsedDataTable } from "../gherkin/datatables/datatable";
import { Docstring } from "../gherkin/doc-string";
import {
  AllureTest,
  AllureRuntime,
  AllureConfig,
  AllureStep,
  AllureGroup,
  LabelName,
  ContentType,
  Status,
  ExecutableItemWrapper,
} from "allure-js-commons";
import path from "path";
import { Fixture } from "../di";
import {
  EndAfterOpts,
  EndBeforeOpts,
  EndScenarioOpts,
  EndSetupOpts,
  EndTeardownOpts,
  StartScenarioOpts,
  StartStepOpts,
} from "../events";
import { AllureStepper } from "./allure-stepper";
import { ScenarioMeta } from "./scenario-meta";
@Fixture
export class AllureTracker {
  readonly runtime: AllureRuntime;
  #test: AllureTest;
  #openGroups: AllureGroup[] = [];
  #openSteps: AllureStep[] = [];
  #hooks: ExecutableItemWrapper[] = [];
  constructor(opts: AllureConfig) {
    this.runtime = new AllureRuntime(opts);
  }

  get stepper() {
    return new AllureStepper(this.step);
  }

  get currentGroup() {
    return this.#openGroups[this.#openGroups.length - 1];
  }

  get currentStep() {
    return this.#openSteps[this.#openSteps.length - 1];
  }

  private get context() {
    return this.currentStep ?? this.currentHook ?? this.#test;
  }
  private get currentHook() {
    return this.#hooks[this.#hooks.length - 1];
  }
  startGroup = (name: string) => {
    const parent = this.currentGroup ?? this.runtime;
    this.#openGroups.push(parent.startGroup(name));
    return this.currentGroup;
  };
  endGroup = (group?: AllureGroup) => {
    const popped = this.#openGroups.pop();
    const actualGroup = group ?? popped;
    if (!actualGroup) {
      throw new Error("No group is open or was provided when ending group.");
    }
    return actualGroup?.endGroup();
  };
  createTestGroup() {
    this.startGroup("test group container");
  }
  endTestGroup() {
    this.endGroup();
  }
  startBefore(name?: string) {
    const before = this.currentGroup.addBefore();
    if (name) {
      before.name = name;
    }
    this.#hooks.push(before);
  }

  endBefore(opts: EndBeforeOpts | EndSetupOpts) {
    const hook = this.#hooks.pop();
    if (!hook) {
      return;
    }
    hook.status = opts.status;
    if (opts?.status === Status.FAILED) {
      this.#test.statusDetails = {
        message: opts.error?.message,
        trace: opts.error?.stack,
      };
    }
  }
  startAfter(name?: string) {
    const after = this.currentGroup.addAfter();
    if (name) {
      after.name = name;
    }
    this.#hooks.push(after);
  }

  endAfter(opts: EndAfterOpts | EndTeardownOpts) {
    const hook = this.#hooks.pop();
    if (!hook) {
      return;
    }

    hook.status = opts.status;
    if (opts?.status === Status.FAILED) {
      this.#test.statusDetails = {
        message: opts.error?.message,
        trace: opts.error?.stack,
      };
    }
  }
  startTest = (name: string, meta: ScenarioMeta, opts: StartScenarioOpts) => {
    this.#test = this.currentGroup.startTest(name);
    if (meta.feature) {
      this.#test.addLabel(LabelName.FEATURE, meta.feature);
      this.#test.addLabel(LabelName.PARENT_SUITE, meta.feature);
    }
    if (meta.path) {
      const dir = path.relative(process.cwd(), path.dirname(meta.path));
      this.#test.addLabel(LabelName.PACKAGE, dir);
    }
    if (meta.subsuite) {
      this.#test.addLabel(LabelName.SUB_SUITE, meta.subsuite);
    }
    if (meta.suite) {
      this.#test.addLabel(LabelName.SUITE, meta.suite);
    }
    if (meta.example) {
      meta.example;
    }
    opts.tags.forEach((tag) => this.#test.addLabel(LabelName.TAG, tag));
    if (opts.uuid) {
      this.#test.historyId = opts.uuid;
    }
    if (opts.examples) {
      opts.examples.forEach((example) => this.#test.addParameter(example.key, `${example.value}`));
    }
  };
  startStep = (name: string, opts?: StartStepOpts) => {
    const step = this.context.startStep(name);
    const argsCopy = [...(opts?.args ?? [])];

    argsCopy.pop();

    argsCopy.forEach((arg) => {
      if (arg instanceof Docstring) {
        if (!arg.mediaType) {
          const filename = this.runtime.writeAttachment(arg.content ?? "", ContentType.TEXT);
          step.addAttachment("Doc String", { contentType: ContentType.TEXT }, filename);
        } else if (arg.mediaType?.toLocaleLowerCase() === "json") {
          const filename = this.runtime.writeAttachment(
            JSON.stringify(arg, null, 2),
            ContentType.JSON
          );
          step.addAttachment("Doc String", { contentType: ContentType.JSON }, filename);
        } else if (arg.mediaType?.toLocaleLowerCase() === "html") {
          const filename = this.runtime.writeAttachment(arg.content ?? "", ContentType.HTML);
          step.addAttachment("Doc String", { contentType: ContentType.HTML }, filename);
        } else if (arg.mediaType?.toLocaleLowerCase() === "xml") {
          const filename = this.runtime.writeAttachment(arg.content ?? "", ContentType.XML);
          step.addAttachment("Doc String", { contentType: ContentType.XML }, filename);
        } else {
          step.addParameter("Doc String", JSON.stringify(arg));
        }
      } else if (arg instanceof ParsedDataTable) {
        const filename = this.runtime.writeAttachment(arg.toCsv(), ContentType.CSV);
        step.addAttachment("DataTable", { contentType: ContentType.CSV }, filename);
      } else {
        step.addParameter(typeof arg, `${JSON.stringify(arg, undefined, 2)}`);
      }
    });
    this.#openSteps.push(step);
    return step;
  };

  endStep = (step?: AllureStep) => {
    const popped = this.#openSteps.pop();
    const actualStep = step ?? popped;
    if (!actualStep) {
      throw new Error("No step is open or was provided when ending step.");
    }

    return actualStep.endStep();
  };

  step = (name: string, action: (step: AllureStep) => void | Promise<void>) => {
    const step = this.startStep(name);
    try {
      const result = action(step);
      if (result instanceof Promise) {
        return (async () => {
          const realResult = await result;
          this.endStep(step);
          return realResult;
        })();
      }
      this.endStep(step);
      step.status = Status.PASSED;
      return result;
    } catch (e) {
      const error = e as Error;
      step.status = Status.FAILED;
      step.statusDetails = { trace: error.stack };
      this.endStep(step);
      throw e;
    }
  };
  end = (opts?: EndScenarioOpts) => {
    this.#test.status = opts?.status;
    this.#test.detailsTrace = opts?.error?.stack;
    if (opts?.modifier === "skip") {
      this.#test.status = Status.SKIPPED;
    }
    if (opts?.status === Status.FAILED) {
      this.#test.statusDetails = {
        message: opts.error?.message,
        trace: opts.error?.stack,
      };
    }

    // this.#openGroups.reverse().forEach((group) => {
    //   this.endGroup();
    // });
    this.#test.endTest();
    if (this.currentGroup.name === "beforeach container") {
      this.endGroup();
    }
    this.#openGroups.forEach((it) => it.endGroup());
  };
}
