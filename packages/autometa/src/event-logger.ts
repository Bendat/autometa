import {
  EndAfterOpts,
  EndBeforeOpts,
  EndFeatureOpts,
  EndRuleOpts,
  EndScenarioOpts,
  EndScenarioOutlineOpts,
  EndSetupOpts,
  EndStepOpts,
  EndTeardownOpts,
  EventSubscriber,
  StartAfterOpts,
  StartBeforeOpts,
  StartFeatureOpts,
  StartRuleOpts,
  StartScenarioOpts,
  StartScenarioOutlineOpts,
  StartSetupOpts,
  StartStepOpts,
  StartTeardownOpts,
} from "@autometa/events";
import colors from "colors-cli";
export class GroupLogEvents implements EventSubscriber {
  onFeatureStart({ title }: StartFeatureOpts) {
    console.group(title);
    console.group();
  }
  onFeatureEnd({ title, status }: EndFeatureOpts): void {
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onScenarioStart({ title }: StartScenarioOpts): void {
    console.group(title);
    console.group();
  }
  onScenarioEnd({ title, status }: EndScenarioOpts): void {
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onScenarioOutlineStart(opts: StartScenarioOutlineOpts): void {
    console.group(opts.title);
    console.group();
  }
  onScenarioOutlineEnd({ title, status }: EndScenarioOutlineOpts): void {
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onRuleStart({ title }: StartRuleOpts): void {
    console.group(title);
    console.group();
  }
  onRuleEnd({ title, status }: EndRuleOpts): void {
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onStepStart({ title }: StartStepOpts) {
    console.group(title);
    console.group();
  }
  onStepEnd({ title, status }: EndStepOpts) {
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onBeforeStart({ title, status }: StartBeforeOpts): void {
    if (status === "SKIPPED") {
      return;
    }
    console.group(title);
    console.group();
  }
  onBeforeEnd({ title, status }: EndBeforeOpts): void {
    if (status === "SKIPPED") {
      return;
    }
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onAfterStart({ title, status }: StartAfterOpts): void {
    if (status === "SKIPPED") {
      return;
    }
    console.group(title);
    console.group();
  }
  onAfterEnd({ title, status }: EndAfterOpts): void {
    if (status === "SKIPPED") {
      return;
    }
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onTeardownStart({ title, status }: StartTeardownOpts): void {
    if (status === "SKIPPED") {
      return;
    }
    console.group(title);
    console.group();
  }
  onTeardownEnd({ title, status }: EndTeardownOpts): void {
    if (status === "SKIPPED") {
      return;
    }
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onSetupStart({ title, status }: StartSetupOpts): void {
    if (status === "SKIPPED") {
      return;
    }
    console.group(title);
    console.group();
  }
  onSetupEnd({ title, status }: EndSetupOpts): void {
    if (status === "SKIPPED") {
      return;
    }
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onBeforeFeatureStart(opts: StartFeatureOpts): void {
    console.group(opts.title);
    console.group();
  }

  onBeforeFeatureEnd(opts: EndFeatureOpts): void {
    console.groupEnd();
    console.log(colorStatus(opts.status, `Ending ${opts.title}`));
    console.groupEnd();
  }

  onAfterFeatureStart(opts: StartFeatureOpts): void {
    console.group(opts.title);
    console.group();
  }

  onAfterFeatureEnd(opts: EndFeatureOpts): void {
    console.groupEnd();
    console.log(colorStatus(opts.status, `Ending ${opts.title}`));
    console.groupEnd();
  }

  onBeforeRuleStart(opts: StartRuleOpts): void {
    console.group(opts.title);
    console.group();
  }

  onBeforeRuleEnd(opts: EndRuleOpts): void {
    console.groupEnd();
    console.log(colorStatus(opts.status, `Ending ${opts.title}`));
    console.groupEnd();
  }

  onAfterRuleStart(opts: StartRuleOpts): void {
    console.group(opts.title);
    console.group();
  }

  onAfterRuleEnd(opts: EndRuleOpts): void {
    console.groupEnd();
    console.log(colorStatus(opts.status, `Ending ${opts.title}`));
    console.groupEnd();
  }

  onBeforeScenarioOutlineStart(opts: StartScenarioOutlineOpts): void {
    console.group(opts.title);
    console.group();
  }

  onBeforeScenarioOutlineEnd(opts: EndScenarioOpts): void {
    console.groupEnd();
    console.log(colorStatus(opts.status, `Ending ${opts.title}`));
    console.groupEnd();
  }

  onBeforeExamplesStart(opts: StartScenarioOutlineOpts): void {
    console.group(opts.title);
    console.group();
  }

  onBeforeExamplesEnd(opts: EndScenarioOpts): void {
    console.groupEnd();
    console.log(colorStatus(opts.status, `Ending ${opts.title}`));
    console.groupEnd();
  }

  onAfterExamplesStart(opts: StartScenarioOutlineOpts): void {
    console.group(opts.title);
    console.group();
  }

  onAfterExamplesEnd(opts: EndScenarioOpts): void {
    console.groupEnd();
    console.log(colorStatus(opts.status, `Ending ${opts.title}`));
    console.groupEnd();
  }
}
function colorStatus(
  status: "FAILED" | "PASSED" | "SKIPPED" | "BROKEN" | undefined,
  text: string
) {
  switch (status) {
    case "FAILED":
      return `${colors.red("x")} ${text}`;
    case "PASSED":
      return `${colors.green("✔️")} ${text}`;
    case "SKIPPED":
      return `${colors.yellow("⊘")} ${text}`;
    default:
      return text;
  }
}
