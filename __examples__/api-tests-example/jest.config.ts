// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

export default {
  clearMocks: true,

  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  moduleFileExtensions: ['feature', 'js', 'json', 'ts', 'tsx'],

  testMatch: [
    '**/?(*.)+(spec|test|feature).[tj]s?(x)',
    '**/*/*.feature',
  ],

  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.feature$': '@autometa/jest-transformer',
  },

  setupFilesAfterEnv: [
    'reflect-metadata',
    './autometa.config.ts'
  ],
  // reporters:
	// [
	// 	'<rootDir>/__integration__/reporter.js',
	// ],
  testPathIgnorePatterns: ['/node_modules/', '/src/.tools/'],
};
