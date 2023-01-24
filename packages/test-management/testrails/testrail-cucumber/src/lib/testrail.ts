import {
  TestRailClient,
  ICaseImpl,
  INewSectionImpl,
  ISection,
  INewSuiteImpl,
} from 'testrail-integration';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import {
  GherkinBackground,
  GherkinRule,
  GherkinScenario,
  GherkinScenarioOutline,
  GherkinTable,
  parseCucumber,
} from '@autometa/shared-utilities';
dotenv.config({ path: path.resolve(__dirname, '../../.secret.env') });

function parseFile(path: string) {
  const text = fs.readFileSync(path, 'utf-8');
  return parseCucumber(text);
}

export async function addFeatureToSuite(
  path: string,
  projectId: number,
  suiteId: number | undefined,
  clientOptions: { username: string; password: string; url: string }
) {
  const client = new TestRailClient(clientOptions);

  const {
    feature: { title, scenarios, outlines, backgrounds, rules, description },
  } = parseFile(path);

  const section = new INewSectionImpl();
  section.suite_id = suiteId;
  section.name = title;
  section.description = description;
  if (!suiteId) {
    const suite = new INewSuiteImpl();
    (suite.name = title), (suite.description = description);
    section.suite_id = (await client.addSuite(projectId, suite)).id;
  }
  const addedSection = await client.addSection(projectId, section);
  await uploadedScenariosAsCases(scenarios, backgrounds, client, addedSection);
  await uploadOutlinesAsCases(outlines, backgrounds, client, addedSection);
  await uploadRulesAsSections(
    rules,
    addedSection,
    client,
    projectId,
    backgrounds
  );
}

async function uploadRulesAsSections(
  rules: GherkinRule[],
  addedSection: ISection,
  client: TestRailClient,
  projectId: number,
  backgrounds: GherkinBackground[]
) {
  for (const rule of [...rules]) {
    const {
      scenarios,
      outlines,
      backgrounds: ruleBackgrounds,
      title,
      description,
    } = rule;
    const ruleSection = new INewSectionImpl();
    ruleSection.suite_id = addedSection.suite_id;
    ruleSection.name = title;
    ruleSection.parent_id = addedSection.id;
    ruleSection.description = description;

    const addedRuleSection = await client.addSection(projectId, ruleSection);
    const bgs = [...backgrounds, ...ruleBackgrounds];
    await uploadedScenariosAsCases(scenarios, bgs, client, addedRuleSection);
    await uploadOutlinesAsCases(outlines, bgs, client, addedRuleSection);
  }
}

async function uploadOutlinesAsCases(
  outlines: GherkinScenarioOutline[],
  backgrounds: GherkinBackground[],
  client: TestRailClient,
  addedSection: ISection
) {
  for (const outline of outlines) {
    const testCase = new ICaseImpl();
    const steps = [
      ...backgrounds.flatMap(({ steps }) => steps),
      ...outline.steps,
    ];
    testCase.title = outline.title;
    testCase.custom_description = outline.description;
    testCase.custom_steps_separated = steps.map((step) => {
      return {
        content: `${step.keyword} ${step.text}`,
      };
    });
    await client.addCase(addedSection.id, testCase);
  }
}

async function uploadedScenariosAsCases(
  scenarios: GherkinScenario[],
  backgrounds: GherkinBackground[],
  client: TestRailClient,
  addedSection: ISection
) {
  for (const scenario of scenarios) {
    const bgs = [...backgrounds].flatMap((it) => it.steps);
    const steps = [...bgs, ...scenario.steps];
    const testCase = new ICaseImpl();
    testCase.title = scenario.title;
    testCase.custom_test_case_description = scenario.description;
    testCase.custom_steps_separated = steps.map((step) => {
      return {
        content: `${step.keyword} ${step.text}\n${transformTable(step.table)}`,
      };
    });
    await client.addCase(addedSection.id, testCase);
  }
}

export function transformTable({ rows, titles }: GherkinTable) {
  if (!titles) {
    return '';
  }
  const headers = '|||' + titles.map((header) => `: ${header}`).join('|');
  const rowRext = rows.map((row) => '||' + row.join('|')).join('\n');
  return `${headers}\n${rowRext}`;
}
