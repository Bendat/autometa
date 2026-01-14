#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const DEV_EXTENDS = '../../configuration/tsconfig/package.config.json';
const BUILD_EXTENDS = '../../configuration/tsconfig/package.build.json';
const TS_SCHEMA = 'https://json.schemastore.org/tsconfig';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function uniqueArray(values) {
  return Array.from(new Set(values));
}

async function main() {
  const tsconfigPaths = await glob('packages/*/tsconfig.json', {
    cwd: repoRoot,
    absolute: true
  });

  for (const tsconfigPath of tsconfigPaths) {
    const pkgDir = path.dirname(tsconfigPath);
    const relativePkgDir = path.relative(repoRoot, pkgDir);

    const devPath = path.join(pkgDir, 'tsconfig.dev.json');
    const buildPath = path.join(pkgDir, 'tsconfig.build.json');
    const shimPath = path.join(pkgDir, 'tsconfig.json');
    const typesPath = path.join(pkgDir, 'tsconfig.types.json');
    const packageJsonPath = path.join(pkgDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      continue;
    }

    const original = readJson(tsconfigPath);
    const include = original.include ?? ['src/**/*'];
    const exclude = original.exclude ?? [
      'node_modules',
      'dist',
      '**/*.spec.ts',
      '**/*.test.ts'
    ];

    const compilerOptions = original.compilerOptions ?? {};
    const buildCompilerOptions = {};

    buildCompilerOptions.rootDir = compilerOptions.rootDir ?? './src';
    buildCompilerOptions.outDir = compilerOptions.outDir ?? './dist';

    if (compilerOptions.baseUrl && compilerOptions.baseUrl !== '.') {
      buildCompilerOptions.baseUrl = compilerOptions.baseUrl;
    }

    if (compilerOptions.types) {
      buildCompilerOptions.types = compilerOptions.types;
    }

    const devConfig = {
      $schema: TS_SCHEMA,
      extends: DEV_EXTENDS,
      include: uniqueArray(include),
      exclude: uniqueArray(exclude)
    };

    const buildConfig = {
      $schema: TS_SCHEMA,
      extends: BUILD_EXTENDS,
      compilerOptions: buildCompilerOptions,
      include: uniqueArray(include),
      exclude: uniqueArray(exclude)
    };

    const shimConfig = {
      $schema: TS_SCHEMA,
      extends: './tsconfig.dev.json'
    };

    writeJson(devPath, devConfig);
    writeJson(buildPath, buildConfig);
    writeJson(shimPath, shimConfig);

    if (fs.existsSync(typesPath)) {
      const typesConfig = readJson(typesPath);
      const typesCompilerOptions = {
        ...(typesConfig.compilerOptions ?? {})
      };

      typesCompilerOptions.composite = true;
      typesCompilerOptions.noEmit = false;
      typesCompilerOptions.declaration = true;
      typesCompilerOptions.emitDeclarationOnly = true;
      typesCompilerOptions.baseUrl = './';
      typesCompilerOptions.rootDir = './src';
      typesCompilerOptions.outDir = './dist';
      typesCompilerOptions.declarationDir = './dist';
      typesCompilerOptions.tsBuildInfoFile = './tsconfig.types.tsbuildinfo';

      if (!typesCompilerOptions.paths) {
        typesCompilerOptions.paths = {
          '@autometa/*': ['../*/dist/index.d.ts']
        };
      }

      const updatedTypesConfig = {
        $schema: TS_SCHEMA,
        extends: './tsconfig.build.json',
        compilerOptions: typesCompilerOptions,
        include: typesConfig.include ?? ['src/**/*'],
        exclude: uniqueArray(
          typesConfig.exclude ?? [
            'node_modules',
            'dist',
            '**/*.spec.ts',
            '**/*.test.ts',
            '.reference'
          ]
        ),
        references: typesConfig.references ?? []
      };

      writeJson(typesPath, updatedTypesConfig);
    } else {
      console.warn(`⚠️  Skipped ${relativePkgDir}: missing tsconfig.types.json`);
    }

    // Update package.json scripts
    const packageJson = readJson(packageJsonPath);
    if (packageJson.scripts) {
      if (packageJson.scripts['type-check']) {
        packageJson.scripts['type-check'] = 'tsc --noEmit -p tsconfig.dev.json';
      }
      if (packageJson.scripts['type-check:watch']) {
        packageJson.scripts['type-check:watch'] = 'tsc --noEmit --watch -p tsconfig.dev.json';
      }
    }
    writeJson(packageJsonPath, packageJson);

    // Update tsup config if present
    const tsupConfigPath = path.join(pkgDir, 'tsup.config.ts');
    if (fs.existsSync(tsupConfigPath)) {
      let tsupSource = fs.readFileSync(tsupConfigPath, 'utf8');
      if (!tsupSource.includes('tsconfig:')) {
        tsupSource = tsupSource.replace(
          /createTsupConfig\(\{\s*/,
          match => `${match}  tsconfig: "./tsconfig.build.json",\n`
        );
      }
      fs.writeFileSync(tsupConfigPath, tsupSource);
    }
  }

  console.log('✅ Split package TypeScript configs into dev/build variants.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
