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
const groupLogger = new GroupLogger();
export const DefaultGroupLogger = groupLogger;
/**
 * Enables the use of console groups,
 * replacing `console`s underlying implementations
 * with an instance of { @see GroupLogger }
 */
export function useConsoleGroups() {
  groupLogger.groupsEnabled = true;
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
  groupLogger.groupsEnabled = false;
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
  groupLogger.group(type, ...tags);
}

export function endGroup(type: ConsoleGroupToken | string) {
  groupLogger.ungroup(type);
}
