import { GetCucumberFunctions, GlobalScope } from "@autometa/scopes";
import { ParameterTypeRegistry } from "@cucumber/cucumber-expressions";
export const { Feature, Given, When, Then, And } = GetCucumberFunctions(
  new ParameterTypeRegistry()
);
