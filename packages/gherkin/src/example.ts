import { Builder, Property } from "@autometa/dto-builder";
import { Scenario } from "./scenario";

export class Example extends Scenario {
  @Property
  readonly example: { [header: string]: string };
}

export const ExampleBuilder = Builder(Example);
