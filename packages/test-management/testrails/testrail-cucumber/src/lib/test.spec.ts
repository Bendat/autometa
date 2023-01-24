import { parseCucumber } from '@autometa/shared-utilities';
import * as fs from 'fs';
test('parsing', () => {
  const featurePath =
    'packages/test-management/testrails/testrail-cucumber/src/lib/test.feature';
  const parsed = parseFile(featurePath);
  console.log(JSON.stringify(parsed, null, 2));
});
function parseFile(path: string) {
  const text = fs.readFileSync(path, 'utf-8');
  return parseCucumber(text);
}
