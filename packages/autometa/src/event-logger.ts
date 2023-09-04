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
  }
  onFeatureEnd({ title, status }: EndFeatureOpts): void {
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onScenarioStart({ title }: StartScenarioOpts): void {
    console.group(title);
  }
  onScenarioEnd({ title, status }: EndScenarioOpts): void {
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onScenarioOutlineStart(opts: StartScenarioOutlineOpts): void {
    console.group(opts.title);
  }
  onScenarioOutlineEnd({ title, status }: EndScenarioOutlineOpts): void {
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onRuleStart({ title }: StartRuleOpts): void {
    console.group(title);
  }
  onRuleEnd({ title, status }: EndRuleOpts): void {
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onStepStart({ title }: StartStepOpts) {
    console.group(title);
  }
  onStepEnd({ title, status }: EndStepOpts) {
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onBeforeStart(opts: StartBeforeOpts): void {
    console.group(opts.title);
  }
  onBeforeEnd({ title, status }: EndBeforeOpts): void {
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onAfterStart(opts: StartAfterOpts): void {
    console.group(opts.title);
  }
  onAfterEnd({ title, status }: EndAfterOpts): void {
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onTeardownStart(opts: StartTeardownOpts): void {
    console.group(opts.title);
  }
  onTeardownEnd({ title, status }: EndTeardownOpts): void {
    console.log(colorStatus(status, `Ending ${title}`));
    console.groupEnd();
  }
  onSetupStart(opts: StartSetupOpts): void {
    console.group(opts.title);
  }
  onSetupEnd({ title, status }: EndSetupOpts): void {
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
