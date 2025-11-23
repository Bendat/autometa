import { resolve, isAbsolute, relative } from "path";
import { existsSync } from "fs";
import type { Plugin } from "vite";
import { Config } from "@autometa/config";
import jiti from "jiti";

export function autometa(): Plugin {
  let autometaConfig: Config | undefined;
  let configPath: string | undefined;

  return {
    name: "autometa-vitest-plugin",
    enforce: "pre",
    async configResolved(viteConfig) {
      const root = viteConfig.root || process.cwd();
      const loaded = await loadAutometaConfig(root);
      autometaConfig = loaded.config;
      configPath = loaded.path;
    },
    transform(code, id) {
      if (id.endsWith(".feature")) {
        if (!autometaConfig) {
          throw new Error("Autometa config not found");
        }
        
        const resolved = autometaConfig.resolve();
        const stepRoots = resolved.config.roots.steps;
        
        // Convert steps to root-relative globs (starting with /)
        // This ensures import.meta.glob works regardless of where the feature file is
        const rootDir = process.cwd(); // Or viteConfig.root
        const stepGlobs = stepRoots.map(root => {
           if (isAbsolute(root)) {
             return "/" + relative(rootDir, root);
           }
           // If it starts with ./ or ../, resolve it relative to config file location?
           // Usually config paths are relative to the config file or CWD.
           // Let's assume CWD for now as that's standard for autometa.
           return "/" + root.replace(/^\.\//, "");
        });

        const runtimeConfig = JSON.stringify(resolved.config);

        return {
          code: `
            import { describe, it, beforeAll, afterAll, beforeEach, afterEach, expect } from 'vitest';
            import { execute } from '@autometa/vitest-executor';
            import { coordinateRunnerFeature, CucumberRunner } from '@autometa/runner';
            import { parseGherkin } from '@autometa/gherkin';

            // Load steps
            const stepModules = import.meta.glob(${JSON.stringify(stepGlobs)}, { eager: true });

            const gherkin = ${JSON.stringify(code)};
            const feature = parseGherkin(gherkin);

            describe(feature.name, () => {
              const steps = CucumberRunner.steps();
              const { plan } = coordinateRunnerFeature({
                feature,
                environment: steps,
                config: ${runtimeConfig}
              });

              execute({ plan, adapter: steps.getPlan(), config: ${runtimeConfig} });
            });
          `,
          map: null
        };
      }
    }
  };
}

async function loadAutometaConfig(root: string): Promise<{ config: Config, path: string }> {
  const _jiti = jiti(root, { interopDefault: true });
  
  const candidates = [
    "autometa.config.ts",
    "autometa.config.js",
    "autometa.config.mts",
    "autometa.config.mjs",
    "autometa.config.cts",
    "autometa.config.cjs"
  ];
  
  for (const candidate of candidates) {
    const path = resolve(root, candidate);
    if (!existsSync(path)) {
      continue;
    }

    try {
      const mod = _jiti(path);
      const config = mod.default || mod;
      
      if (isConfig(config)) {
        return { config, path };
      } else {
        console.warn(`Found config at ${path} but it does not export a Config instance.`);
      }
    } catch (e: any) {
      console.error(`Error loading config at ${path}:`, e);
      throw e;
    }
  }
  throw new Error("Could not find autometa.config.{ts,js,mjs,cjs} in " + root);
}

function isConfig(config: unknown): config is Config {
  return (
    typeof config === 'object' &&
    config !== null &&
    'resolve' in config &&
    typeof (config as Config).resolve === 'function' &&
    'current' in config &&
    typeof (config as Config).current === 'function'
  );
}
