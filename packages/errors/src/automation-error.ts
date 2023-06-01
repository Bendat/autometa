import { Feature, Rule, Scenario, Step } from "@autometa/gherkin";
interface AutomationErrorOpts {
  feature?: Feature;
  rule?: Rule;
  scenario?: Scenario;
  step?: Step;
  cause?: Error;
}
export class AutomationError extends Error {
  constructor(message: string, public opts: AutomationErrorOpts = {}) {
    super(message);
    this.name = "AutomationError";
  }
}
