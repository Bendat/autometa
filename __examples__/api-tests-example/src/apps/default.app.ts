import { AppType, Fixture } from "@autometa/runner";
import { World } from "./default.world";
import { TestContainer } from "../test-container";
import { LIFE_CYCLE } from "@autometa/app";
@Fixture(LIFE_CYCLE.Singleton)
class SingletonFixture {
  value: number;
}
@AppType(World)
export class DefaultApp {
  constructor(
    readonly container: TestContainer,
    readonly singleton: SingletonFixture
  ) {}
  report: {
    outterbackgroundstep: boolean;
    outterscenario1step: boolean;
    outterscenario2step: boolean;
    outerscenariooutlinestep: number;
    skippedouterscenariostep: boolean;
    rule1backgroundstep: boolean;
    rule1scenariostep: boolean;
    rule2backgroundstep: boolean;
    rule2scenariostep: boolean;
    rule2skippedscenario: boolean;
  } = {
    outterbackgroundstep: false,
    outterscenario1step: false,
    outterscenario2step: false,
    outerscenariooutlinestep: 0,
    skippedouterscenariostep: false,
    rule1backgroundstep: false,
    rule1scenariostep: false,
    rule2backgroundstep: false,
    rule2scenariostep: false,
    rule2skippedscenario: false
  };
}
