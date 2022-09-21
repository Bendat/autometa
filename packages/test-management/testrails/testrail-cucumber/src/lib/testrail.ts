import {
  TestRailClient,
  INewTestResultImpl,
  ICaseImpl,
  INewSectionImpl,
  ISection,
} from 'testrail-integration';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { parseCucumber } from './parsing/parser';
import {
  GherkinBackground,
  GherkinRule,
  GherkinScenario,
  GherkinScenarioOutline,
} from './parsing/gherkin-objects';
dotenv.config({ path: path.resolve(__dirname, '../../.secret.env') });


function parseFile(path: string) {
  const text = fs.readFileSync(path, 'utf-8');
  return parseCucumber(text);
}

export async function addFeatureToSuite(
  path: string,
  projectId: number,
  suiteId: number,
  clientOptions: {username: string, password: string, url: string}
) {
  const client = new TestRailClient(clientOptions);

  const {
    feature: { title, scenarios, outlines, backgrounds, rules },
  } = parseFile(path);

  const section = new INewSectionImpl();
  section.suite_id = suiteId;
  section.name = title;

  const addedSection = await client.addSection(projectId, section);
  await uploadedScenariosAsCases(scenarios, backgrounds, client, addedSection);
  await uploadOutlinesAsCases(outlines, backgrounds, client, addedSection);
  await uploadRulesAsSections(
    rules,
    suiteId,
    addedSection,
    client,
    projectId,
    backgrounds
  );
}

async function uploadRulesAsSections(
  rules: GherkinRule[],
  suiteId: number,
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
    } = rule;
    const ruleSection = new INewSectionImpl();
    ruleSection.suite_id = suiteId;
    ruleSection.name = title;
    ruleSection.parent_id = addedSection.id;

    const addedRuleSection = await client.addSection(projectId, ruleSection);
    const bgs = [...backgrounds, ...ruleBackgrounds]
    await uploadedScenariosAsCases(scenarios, bgs, client, addedRuleSection)
    await uploadOutlinesAsCases(outlines, bgs, client, addedRuleSection)
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
    testCase.custom_steps_separated = steps.map((step) => {
      return {
        content: `${step.keyword} ${step.text}`,
      };
    });
    await client.addCase(addedSection.id, testCase);
  }
}
