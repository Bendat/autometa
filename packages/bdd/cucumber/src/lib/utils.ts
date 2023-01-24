import * as path from 'path';
import * as fs from 'fs';
import projectRootDirectory from 'project-root-directory';
import {
  PreparedStepGroup,
  PreparedStepCallback,
  StepData,
  PreparedStepData,
} from './types';
import { parseCucumber } from '@autometa/shared-utilities';

export function assignTextStep(
  text: string | RegExp,
  group: PreparedStepGroup,
  callback: PreparedStepCallback,
  isGlobal
) {
  const value = text as unknown as string;
  group[value] = new StepData(value, undefined, callback, isGlobal);
}

export function throwErrorIfNoMatch(
  matchingStep: PreparedStepData,
  keyword: string,
  text: string
) {
  if (!matchingStep) {
    throw new Error(
      `No matching step found in feature file for ${keyword} ${text}`
    );
  }
}

export function assignRegexStep(
  text: RegExp,
  callback: PreparedStepCallback,
  group: PreparedStepGroup,
  matcher: (
    regex: RegExp,
    group: string,
    callback: PreparedStepCallback
  ) => StepData | undefined
) {
  const step = matcher(text, group.__keyword__, callback);
  if (step) {
    group[step.text] = step;
  }
}

export function readFeature(file: string, callerFile: string) {
  const path = getFeatureByPath(file, callerFile);
  const text = fs.readFileSync(path, 'utf-8');
  return parseCucumber(text);
}

export function getFeatureByPath(file: string, callerFile: string) {
  if (path.isAbsolute(file)) {
    console.warn(
      'using an absolute path to a feature file. Are you sure you want to do that?'
    );
    return file;
  }
  const rootRegex = /[~]\//;
  if (rootRegex.test(file)) {
    const root = projectRootDirectory;
    const filePath = file.replace(rootRegex, '');
    const resolved = path.resolve(root, filePath);
    return resolved;
  }
  const callerDirectory = path.dirname(callerFile || '');
  return path.resolve(callerDirectory, file);
}
