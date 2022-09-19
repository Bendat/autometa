import { ConsoleGroupToken } from './group-tokens';
import { GroupLogger } from './group-logger';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
console.group = (..._: unknown[]) => undefined;
console.groupEnd = () => undefined;
const originalLog = console.log;
const originalInfo = console.info;
const originalWarn = console.warn;
const originalError = console.error;
const originalGroup = console.group;
const originalGroupEnd = console.groupEnd;
let groupsEnabled = false;
const groupLogger = new GroupLogger();

/**
 * Enables the use of console groups,
 * replacing `console`s underlying implementations
 * with an instance of { @see GroupLogger }
 */
export function useConsoleGroups() {
  groupsEnabled = true;
  console.log = groupLogger.log;
  console.info = groupLogger.info;
  console.warn = groupLogger.warn;
  console.error = groupLogger.error;
  console.group = groupLogger.group;
  console.groupEnd = groupLogger.ungroup;
}

/**
 * Disables group logging, returning `console`s
 * original function implementations
 */
export function disableConsoleGroups() {
  groupsEnabled = false;
  console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;
  console.group = originalGroup;
  console.groupEnd = console.groupEnd = originalGroupEnd;
  console.info = originalInfo;
}

export function grouping<T>(
  title: string,
  action: () => T | Promise<T>
): T | Promise<T> {
  return groupLogger.grouping(title, action);
}

export function startGroup(
  type: ConsoleGroupToken | string,
  ...tags: (string | RegExp)[]
) {
  if (groupsEnabled) {
    groupLogger.group(type, ...tags);
  }
}

export function endGroup(type: ConsoleGroupToken | string) {
  if (groupsEnabled) {
    groupLogger.ungroup(type);
  }
}
