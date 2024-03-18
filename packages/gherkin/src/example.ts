import { Builder } from "@autometa/dto-builder";
import { Scenario } from "./scenario";

export class Example extends Scenario {
  readonly table: { [header: string]: string };
}

export class ExampleBuilder extends Builder(Example) {}
