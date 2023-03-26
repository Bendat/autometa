import { Fixture, Persistent } from "@autometa/cucumber-runner";
import { AllureStepper } from "@autometa/cucumber-runner";
import { World } from "./world";
@Fixture
export class HTTPClient {}
@Fixture
@Persistent
export class App {
  constructor(
    readonly world: World,
    readonly httpClient: HTTPClient,
    readonly stepper: AllureStepper
  ) {}
}
