import { Builder, DtoBuilder, Property } from "@autometa/dto-builder";
import { Class } from "@autometa/types";
import { Scenario } from "./scenario";

export class Example extends Scenario {
  @Property
  readonly example: { [header: string]: string };
}

export const ExampleBuilder: Class<DtoBuilder<Example>> = Builder(Example);
