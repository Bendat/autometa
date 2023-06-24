import { AllureStep } from "allure-js-commons";
import { Fixture } from "../di";

@Fixture
export class AllureStepper {
  constructor(
    readonly step: (
      name: string,
      action: (step: AllureStep) => void | Promise<void>
    ) => void | Promise<void>
  ) {}
}
