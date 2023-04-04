import {
  AstBuilder,
  GherkinClassicTokenMatcher,
  Parser,
} from "@cucumber/gherkin";
import {
  DataTable,
  Examples,
  Feature,
  IdGenerator,
  Rule,
  Scenario,
  //   Rule,
  Step,
  Tag,
} from "@cucumber/messages";
import sanitize from "xss";
import prettier from "prettier";
const uuidFn = IdGenerator.uuid();
const builder = new AstBuilder(uuidFn);
const matcher = new GherkinClassicTokenMatcher();

const parser = new Parser(builder, matcher);
parser.stopAtFirstError = true;

function parseChildren(feature?: Feature) {
  if (!feature) {
    throw new Error("Feature not found");
  }
  return `${parseBackground(feature) ?? ""}
${parseScenarios(feature)}
${parseScenarioOutlines(feature)}
${parseRules(feature)}`;
}

function parseRuleChildren(feature?: Rule) {
  if (!feature) {
    throw new Error("Feature not found");
  }

  return `${parseBackground(feature) ?? ""}
${parseScenarios(feature)}
${parseScenarioOutlines(feature)}`;
}

function parseRules(feature?: Feature) {
  return feature?.children
    .filter((it) => it.rule)
    .map((it) => it.rule as Rule)
    .map((it) => {
      return `# **Rule**: ${it.name}
${formatMultiline(it.description)}
${parseRuleChildren(it)}
 `;
    })
    .join("\n");
}

function parseScenarios(feature: Feature | Rule) {
  const scenarios = feature.children
    ?.filter((it) => it.scenario)
    .filter((it) => !it.scenario?.examples.length)
    .map((it) => parseScenario(it.scenario as Scenario));
  return scenarios?.join("\n\n") ?? "";
}

function parseScenarioOutlines(feature: Feature | Rule) {
  const scenarios = feature.children
    ?.filter((it) => it.scenario)
    .filter((it) => it.scenario?.examples.length)
    .map((it) => it.scenario as Scenario)
    .map(parseScenarioOutline);
  return scenarios?.join("\n\n");
}
function parseScenario(scenario: Scenario, depth = 0) {
  return `${"#".repeat(
    depth + 2
  )} **_${scenario.keyword?.trim()}_**: _${scenario.name.trim()}_
  ${formatTags(scenario.tags)}

${scenario.description ? formatMultiline(scenario.description) : ""}
${scenario?.steps ? "#".repeat(depth + 3) + " Steps\n" : ""}
${parseSteps(...(scenario?.steps ?? []))}
  -----------------
  `;
}

function formatTags(tags?: readonly Tag[]) {
  if (!tags) {
    return "";
  }
  return (tags.length ?? 0) > 0
    ? "\n**Tags**: " + tags.map((it) => "`" + it.name + "`").join("\n") + "\n"
    : "";
}

function formatMultiline(str: string) {
  const text = str ?? "";
  return (
    text
      .trimStart()
      .split(/\r?\n/)
      .map((row) =>
        row
          .trim()
          .split("\n")
          .map((it) => (it ? `\n_${it.trimEnd()}_` : ""))
      )
      .join("\n") + "\n"
  );
}

function parseScenarioOutline(scenario: Scenario, depth = 0) {
  return `${"#".repeat(
    depth + 2
  )} **_${scenario.keyword?.trim()}_**: _${scenario.name.trim()}_
${formatTags(scenario.tags)}
${scenario.description ? formatMultiline(scenario.description) + "\n" : ""}
${scenario?.steps ? "#".repeat(depth + 3) + " Steps\n" : ""}
${parseSteps(...(scenario?.steps ?? []))}

${parseExamples(scenario)}
-----------------
  `;
}

function parseExamples(scenario: Scenario, depth = 0) {
  return scenario.examples
    .map((ex) => {
      return `${"#".repeat(depth + 3)} Examples: ${formatMultiline(
        ex.description
      )}
${formatTags(ex.tags)}
${parseExampleTable(ex)}`;
    })
    .join("\n");
}
function parseExampleTable(examples: Examples) {
  const headers =
    examples.tableHeader?.cells.map((cell) => "| " + cell.value).join(" ") +
    "|";
  const seperator =
    examples.tableHeader?.cells.map(() => "| --- ").join(" ") + "|";
  const data = examples.tableBody
    .map((row) => {
      return row.cells.map((cell) => "| " + cell.value).join(" ");
    })
    .join("|\n");
  return `${headers}
${seperator}
${data}`;
}

function parseBackground(feature: Feature | Rule, depth = 0) {
  const bg = feature.children?.find((it) => it.background);
  if (bg) {
    return `${"#".repeat(depth + 2)} **_${
      bg.background?.keyword
    }_**: _${bg.background?.name.trimEnd()}_

${
  bg.background?.description
    ? formatMultiline(bg.background.description) + "\n"
    : ""
}
${bg.background?.steps ? "#".repeat(depth + 3) + " Steps\n" : ""}
${parseSteps(...(bg.background?.steps ?? []))}
-------------------`;
  }
  return "";
}

function parseSteps(...steps: Step[]) {
  return steps.map((step) => parseStep(step)).join("\n");
}

function parseStep(step: Step) {
  const docstring = step.docString
    ? `\`\`\`${step.docString.mediaType ?? ""} title='Doc String'
${step.docString.content ?? ""}
\`\`\``
    : "";
  return `**_${step.keyword.trim()}_** ${sanitize(step.text)}

${step.dataTable ? parseDatatable(step.dataTable) : ""}
${docstring}`;
}

function parseDatatable(data: DataTable) {
  const cells = data.rows
    .map((row) => {
      return "|" + row.cells.map((cell) => cell.value).join("|");
    })
    .join("|\n");
  const heading =
    data.rows.length > 0
      ? "|  Data Table " + "|   ".repeat(data.rows.length) + "|"
      : "";
  const buffer =
    data.rows.length > 0 ? "| --- ".repeat(data.rows.length + 1) + "|" : "";
  return `${heading}
${buffer}
${cells}|`;
}

export function convertToMarkdown(featureString: string) {
  const gherkin = parser.parse(featureString);
  const template = `# ${gherkin.feature?.name}
  
${formatTags(gherkin.feature?.tags)}
${formatMultiline(gherkin.feature?.description ?? "")}
${parseChildren(gherkin.feature)}
`;
  return prettier.format(template, { parser: "markdown" });
}
export function convertFeatureToMarkdown(feature: Feature) {
  const gherkin = {feature}
  const template = `# ${gherkin.feature?.name}
  
${formatTags(gherkin.feature?.tags)}
${formatMultiline(gherkin.feature?.description ?? "")}
${parseChildren(gherkin.feature)}
`;
  return prettier.format(template, { parser: "markdown" });
}
export function serialize(featureString: string) {
  return parser.parse(featureString);
}
