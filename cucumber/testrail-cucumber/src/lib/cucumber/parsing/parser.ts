import {
  AstBuilder,
  GherkinClassicTokenMatcher,
  Parser,
} from "@cucumber/gherkin";
import {
  Examples,
  Feature,
  GherkinDocument,
  IdGenerator,
  Rule,
  Scenario,
  Step,
  TableRow,
} from "@cucumber/messages";
import { notEmpty } from "../../collection-utilities";
import {
  GherkinBackground,
  GherkinExample,
  GherkinRule,
  GherkinScenario,
  GherkinScenarioOutline,
  GherkinStep,
  GherkinSteps,
  GherkinTable,
  GherkinTest,
} from "./gherkin-objects";
const uuidFn = IdGenerator.uuid();
const builder = new AstBuilder(uuidFn);
const matcher = new GherkinClassicTokenMatcher(); // or Gherkin.GherkinInMarkdownTokenMatcher()

const parser = new Parser(builder, matcher);
parser.stopAtFirstError = true;

export function parseCucumber(gherkin: string) {
  const gherkinDocument = parser.parse(gherkin);
  return parseGherkinTest(gherkinDocument);
}

function parseGherkinTest(doc: GherkinDocument): GherkinTest {
  const { feature } = doc;
  if (!feature) {
    throw new Error("No `feature` defined in gherkin document");
  }
  const { language, name, tags, description } = feature;
  const backgrounds: GherkinBackground[] = parseGherkinBackgrounds(feature);
  const scenarios: GherkinScenario[] = parseGherkinScenarios(feature);
  const outlines: GherkinScenarioOutline[] =
    parseGherkinScenarioOutlines(feature);
  const rules = parseGherkinRules(feature);
  const tagStrings = tags.map((it) => it.name);
  return {
    language,
    feature: {
      title: name,
      description: description.trimStart(),
      backgrounds,
      scenarios,
      outlines,
      rules,
      tags: tagStrings,
    },
  };
}

function parseGherkinRules({
  children,
  tags: featureTags,
}: Feature): GherkinRule[] {
  if (!children) {
    return [];
  }
  return children
    .map(({ rule }) => rule)
    .filter(notEmpty)
    .map((rule) => {
      const { name, tags, description } = rule;
      const backgrounds: GherkinBackground[] = parseGherkinBackgrounds(rule);
      const scenarios: GherkinScenario[] = parseGherkinScenarios(rule);
      const outlines: GherkinScenarioOutline[] =
        parseGherkinScenarioOutlines(rule);
      return {
        title: name,
        description: description.trimStart(),
        backgrounds,
        scenarios,
        outlines,
        tags: [
          ...featureTags.map((it) => it.name),
          ...tags.map((it) => it.name),
        ],
      };
    });
}

function parseGherkinBackgrounds({
  children,
}: Feature | Rule): GherkinBackground[] {
  return children
    .map(({ background }) => background)
    .filter(notEmpty)
    .map<GherkinBackground>(({ name, steps }) => ({
      title: name,
      steps: parseSteps([...steps]),
    }));
}

function parseGherkinScenarios({ children, tags }: Feature | Rule) {
  return children
    .map(({ scenario }) => scenario)
    .filter(notEmpty)
    .filter(isScenario)
    .map(({ name, steps, tags: scenarioTags, description }) => ({
      title: name,
      description: description.trimStart(),
      steps: parseSteps([...steps]),
      rule: undefined,
      tags: [...tags, ...scenarioTags].map((it) => it.name),
    }));
}

function parseGherkinScenarioOutlines({
  children,
  tags: featureTags,
}: Feature | Rule): GherkinScenarioOutline[] {
  return children
    .map(({ scenario }) => scenario)
    .filter(notEmpty)
    .filter(isScenarioOutline)
    .map<GherkinScenarioOutline>((so) => {
      const { name, steps, examples, tags, description } = so;
      const allTags = [...featureTags, ...tags].map((it) => it.name);
      return makeScenarioOutline(steps, examples, description, name, allTags);
    });
}

function makeScenarioOutline(
  steps: readonly Step[],
  examples: readonly Examples[],
  description: string,
  name: string,
  tags: string[]
) {
  const parsedSteps = parseSteps([...steps]);
  const parsedExamples = parseExamples([...examples]);
  const scenarios = parseOutlineScenarios(
    name,
    description,
    parsedSteps,
    parsedExamples,
    tags
  );
  return new GherkinScenarioOutline(
    name,
    description,
    parsedSteps,
    parsedExamples,
    scenarios,
    tags
  );
}

function parseOutlineScenarios(
  title: string,
  description: string,
  outlineSteps: GherkinSteps,
  examples: GherkinExample[],
  tags: string[]
) {
  const scenarios: GherkinScenario[] = [];
  for (const { headers, values } of examples) {
    for (const row of values) {
      makeScenarioForExample(
        title,
        description,
        scenarios,
        outlineSteps,
        headers,
        row,
        tags
      );
    }
  }
  return scenarios;
}

function makeScenarioForExample(
  title: string,
  description: string,
  scenarios: GherkinScenario[],
  outlineSteps: GherkinSteps,
  headers: string[],
  row: string[],
  tags: string[]
) {
  const steps: GherkinStep[] = [];

  const scenario = new GherkinScenario(
    title,
    description,
    steps,
    undefined,
    tags
  );
  scenarios.push(scenario);

  for (const { keyword, text, table } of outlineSteps) {
    const injectedText = injectVariables(text, headers, row);
    extractVariablesForScenario(
      injectedText,
      text,
      headers,
      row,
      steps,
      keyword,
      table
    );
  }
}

function extractVariablesForScenario(
  text: string,
  originalText: string,
  headers: string[],
  row: string[],
  steps: GherkinStep[],
  keyword: string,
  table: GherkinTable | undefined
) {
  const regex = /<[^\s<>](?:[^<>]*[^\s<>])?>/g;
  const variables =
    originalText.match(regex)?.map((it) => it.replace(/[<>']+/g, "")) ?? [];
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const variable = row[i];
    const index = variables.indexOf(header);
    if (header && index != -1) {
      variables[index] = variable;
    }
  }
  steps.push(new GherkinStep(keyword, text, variables, table));
}

function injectVariables(text: string, headers: string[], row: string[]) {
  let str = text;
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const value = row[i];
    if (header && value) {
      str = str.replace(`<${header}>`, value);
    }
  }
  return str;
}

function parseSteps(steps: Step[]): GherkinSteps {
  // TODO swap to loop, keep context of Given, When Then in And, But
  return steps.map<GherkinStep>(
    ({ keyword, text, dataTable }) =>
      new GherkinStep(
        keyword.trimEnd(),
        text,
        [...parseStepVariables(text)],
        parseTable(dataTable?.rows)
      )
  );
}

function parseExamples(examples: Examples[]): GherkinExample[] {
  return examples
    .map(({ tableHeader, tableBody }) => {
      const headers =
        tableHeader?.cells.map(({ value }) => value).filter(notEmpty) ?? [];
      const values = tableBody?.map(({ cells }) =>
        cells.map(({ value }) => value)
      );
      return {
        headers,
        values,
      };
    })
    .filter(notEmpty);
}

function parseStepVariables(text: string): string[] {
  const variableRegex = /<(.*?)>/g;
  const match = text.match(variableRegex) ?? [];

  return match.map((it) => it.replace("<", "").replace(">", ""));
}

function parseTable(rows?: readonly TableRow[]): GherkinTable {
  // convert cells to only their string value
  // split the first row, which contain the headers,
  // and retain the rest which contain the list of values
  // for each row
  const [titles, ...values] =
    rows?.map((row) => {
      return row.cells.map(({ value }) => value);
    }) ?? [];
  return { titles, rows: values };
}

const isScenario = ({ keyword }: Scenario) => {
  return keyword.trim() == "Scenario";
};

const isRule = ({ keyword }: Rule) => {
  return keyword.trim() == "Rule";
};

const isScenarioOutline = ({ examples }: Scenario) => {
  return examples.length;
};
