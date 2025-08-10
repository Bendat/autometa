#!/usr/bin/env node

/**
 * This script automatically manages TypeScript project references
 * to enable incremental compilation across the monorepo
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function updateProjectReferences() {
  console.log('🔄 Updating TypeScript project references...');

  // Find all packages with tsconfig.json
  const tsconfigPaths = await glob('*/*/tsconfig.json', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', 'dist/**']
  });

  // Map of package name to its path
  const packageMap = new Map();
  
  // Build package map
  for (const tsconfigPath of tsconfigPaths) {
    const packageDir = path.dirname(tsconfigPath);
    const packageJsonPath = path.join(packageDir, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8')
        );
        packageMap.set(packageJson.name, packageDir);
      } catch (error) {
        console.warn(`⚠️  Failed to read ${packageJsonPath}:`, error);
      }
    }
  }

  // Update each package's tsconfig.json with proper references
  for (const tsconfigPath of tsconfigPaths) {
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

      // Find internal dependencies
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const references = [];
      
      for (const [depName] of Object.entries(allDeps || {})) {
        if (packageMap.has(depName)) {
          const depPath = packageMap.get(depName);
          const relativePath = path.relative(packageDir, depPath);
          references.push({ path: relativePath });
        }
      }

      // Update tsconfig
      tsconfig.references = references;
      
      fs.writeFileSync(
        tsconfigPath,
        JSON.stringify(tsconfig, null, 2) + '\n'
      );
      
      console.log(`✅ Updated ${tsconfigPath} with ${references.length} references`);
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

      rootTsconfig.references = Array.from(packageMap.values()).map(packageDir => ({
        path: packageDir
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
