/* eslint-disable */
export default {
  displayName: 'bdd-cucumber-integration-tests',
  testMatch: ['**/*.steps.ts', '**/*.spec.ts'],
  preset: '../../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory:
    '../../../coverage/packages/bdd/cucumber-integration-tests',
};
