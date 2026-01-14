#!/usr/bin/env node

/**
 * This script automatically manages TypeScript project references
 * to enable incremental compilation across the monorepo
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const toPosix = (value) => value.split(path.sep).join('/');

async function updateProjectReferences() {
  console.log('🔄 Updating TypeScript project references...');

  const tsconfigTypesPaths = await glob('*/*/tsconfig.types.json', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', 'dist/**']
  });

  // Map of package name to its path
  const packageMap = new Map();
  
  // Build package map
  for (const tsconfigPath of tsconfigTypesPaths) {
    const packageDir = path.dirname(tsconfigPath);
    const packageJsonPath = path.join(packageDir, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8')
        );

        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
          ...packageJson.peerDependencies
        };

        packageMap.set(packageJson.name, {
          dir: packageDir,
          dependencies: Object.keys(allDeps || {})
        });
      } catch (error) {
        console.warn(`⚠️  Failed to read ${packageJsonPath}:`, error);
      }
    }
  }

  // Update each package's tsconfig.types.json with proper references
  for (const tsconfigPath of tsconfigTypesPaths) {
    const packageDir = path.dirname(tsconfigPath);
    const packageJsonPath = path.join(packageDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) continue;

    try {
      const packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, 'utf-8')
      );

      const tsconfig = JSON.parse(
        fs.readFileSync(tsconfigPath, 'utf-8')
      );

      const packageInfo = packageMap.get(packageJson.name);
      const references = [];

      for (const depName of packageInfo?.dependencies || []) {
        if (packageMap.has(depName)) {
          const depInfo = packageMap.get(depName);
          const relativeDir = path.relative(packageDir, depInfo.dir);
          const referencePath = toPosix(path.join(relativeDir, 'tsconfig.types.json'));

          references.push({ path: referencePath });
        }
      }

      tsconfig.references = references;

      fs.writeFileSync(
        tsconfigPath,
        JSON.stringify(tsconfig, null, 2) + '\n'
      );

      console.log(`✅ Updated ${tsconfigPath} with ${references.length} type references`);
    } catch (error) {
      console.warn(`⚠️  Failed to update ${tsconfigPath}:`, error);
    }
  }

  // Update root tsconfig.json
  const rootTsconfigPath = 'tsconfig.json';
  if (fs.existsSync(rootTsconfigPath)) {
    try {
      const rootTsconfig = JSON.parse(
        fs.readFileSync(rootTsconfigPath, 'utf-8')
      );

      rootTsconfig.references = Array.from(packageMap.values()).map(({ dir }) => ({
        path: toPosix(path.join(dir, 'tsconfig.types.json'))
      }));

      fs.writeFileSync(
        rootTsconfigPath,
        JSON.stringify(rootTsconfig, null, 2) + '\n'
      );
      
      console.log(`✅ Updated root tsconfig.json with ${rootTsconfig.references.length} project references`);
    } catch (error) {
      console.warn(`⚠️  Failed to update root tsconfig.json:`, error);
    }
  }

  console.log('🎉 TypeScript project references updated successfully!');
}

updateProjectReferences().catch(console.error);
