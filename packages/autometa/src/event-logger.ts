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
  StartTeardownOpts
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
  onBeforeStart(opts: StartBeforeOpts): void {
    console.group(opts.title);
  }
  onBeforeEnd({ title, status }: EndBeforeOpts): void {
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onAfterStart(opts: StartAfterOpts): void {
    console.group(opts.title);
    console.group();

  }
  onAfterEnd({ title, status }: EndAfterOpts): void {
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onTeardownStart(opts: StartTeardownOpts): void {
    console.group(opts.title);
    console.group();
  }
  onTeardownEnd({ title, status }: EndTeardownOpts): void {
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onSetupStart(opts: StartSetupOpts): void {
    console.group(opts.title);
    console.group();

  }
  onSetupEnd({ title, status }: EndSetupOpts): void {
    console.groupEnd();
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
}

function colorStatus(
  status: "FAILED" | "PASSED" | "SKIPPED" | "BROKEN" | undefined,
  text: string
) {
  switch (status) {
    case "FAILED":
      return colors.red_b(text);
    case "PASSED":
      return colors.green_b(text);
    case "SKIPPED":
      return colors.yellow_b(text);
    default:
      return text;
  }
}
