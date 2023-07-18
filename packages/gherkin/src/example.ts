import { Builder, Property } from "@autometa/dto-builder";
import { Scenario } from "./scenario";

export class Example extends Scenario {
  @Property
  readonly row: { [header: string]: string };
}

export class ExampleBuilder extends Builder(Example){}
