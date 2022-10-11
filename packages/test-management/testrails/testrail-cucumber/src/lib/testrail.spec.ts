import { GherkinTable } from '@autometa/shared-utilities';
import { transformTable } from './testrail';

describe('transformTable', () => {
  it('Should transform a gherkin table into a testrails table', () => {
    const gherkinTable = new GherkinTable(
      ['roomName', 'roomType'],
      [
        ['private', 'Private Suite'],
        ['dorm', '5 Bed Dorm'],
      ]
    );
    const table = transformTable(gherkinTable);
    console.log(table);
  });
});
