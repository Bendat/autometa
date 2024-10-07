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
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
  }
  onScenarioStart({ title }: StartScenarioOpts): void {
    console.group(title);
    console.group();
  }
  onScenarioEnd({ title, status }: EndScenarioOpts): void {
    console.groupEnd();
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
  }
  onScenarioOutlineStart(opts: StartScenarioOutlineOpts): void {
    console.group(opts.title);
    console.group();
  }
  onScenarioOutlineEnd({ title, status }: EndScenarioOutlineOpts): void {
    console.groupEnd();
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
  }
  onRuleStart({ title }: StartRuleOpts): void {
    console.group(title);
    console.group();
  }
  onRuleEnd({ title, status }: EndRuleOpts): void {
    console.groupEnd();
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
  }
  onStepStart({ title }: StartStepOpts) {
    console.group(title);
    console.group();
  }
  onStepEnd({ title, status }: EndStepOpts) {
    console.groupEnd();
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
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
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
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
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
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
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
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
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
  }
  onBeforeFeatureStart(opts: StartFeatureOpts): void {
    console.group(opts.title);
    console.group();
  }

  onBeforeFeatureEnd(opts: EndFeatureOpts): void {
    console.groupEnd();
    console.groupEnd();
    console.log(colorStatus(opts.status, `Ending ${opts.title}`));
  }

  onAfterFeatureStart(opts: StartFeatureOpts): void {
    console.group(opts.title);
    console.group();
  }

  onAfterFeatureEnd(opts: EndFeatureOpts): void {
    console.groupEnd();
    console.groupEnd();
    console.log(colorStatus(opts.status, `Ending ${opts.title}`));
  }

  onBeforeRuleStart(opts: StartRuleOpts): void {
    console.group(opts.title);
    console.group();
  }

  onBeforeRuleEnd(opts: EndRuleOpts): void {
    console.groupEnd();
    console.groupEnd();
    console.log(colorStatus(opts.status, `Ending ${opts.title}`));
  }

  onAfterRuleStart(opts: StartRuleOpts): void {
    console.group(opts.title);
    console.group();
  }

  onAfterRuleEnd(opts: EndRuleOpts): void {
    console.groupEnd();
    console.groupEnd();
    console.log(colorStatus(opts.status, `Ending ${opts.title}`));
  }

  onBeforeScenarioOutlineStart(opts: StartScenarioOutlineOpts): void {
    console.group(opts.title);
    console.group();
  }

  onBeforeScenarioOutlineEnd(opts: EndScenarioOpts): void {
    console.groupEnd();
    console.groupEnd();
    console.log(colorStatus(opts.status, `Ending ${opts.title}`));
  }

  onBeforeExamplesStart(opts: StartScenarioOutlineOpts): void {
    console.group(opts.title);
    console.group();
  }

  onBeforeExamplesEnd(opts: EndScenarioOpts): void {
    console.groupEnd();
    console.groupEnd();
    console.log(colorStatus(opts.status, `Ending ${opts.title}`));
  }

  onAfterExamplesStart(opts: StartScenarioOutlineOpts): void {
    console.group(opts.title);
    console.group();
  }

  onAfterExamplesEnd(opts: EndScenarioOpts): void {
    console.groupEnd();
    console.groupEnd();
    console.log(colorStatus(opts.status, `Ending ${opts.title}`));
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
