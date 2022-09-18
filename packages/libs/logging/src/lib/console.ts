import {
  blackBright,
  bold,
  red,
  StyleFunction,
  white,
  yellow,
} from 'ansi-colors';
import * as util from 'util';
import getCurrentLine from 'get-current-line';
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
export function useConsoleGroups() {
  groupsEnabled = true;
  console.log = groupLogger.log;
  console.info = groupLogger.info;
  console.warn = groupLogger.warn;
  console.error = groupLogger.error;
  console.group = groupLogger.group;
  console.groupEnd = groupLogger.ungroup;
}

export function disableConsoleGroups() {
  groupsEnabled = false;
  console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;
  console.group = originalGroup;
  console.groupEnd = console.groupEnd = originalGroupEnd;
  console.info = originalInfo;
}

const groupStack: (ConsoleGroupToken | string)[] = [];

export function grouping<T>(
  title: string,
  action: () => T | Promise<T>
): T | Promise<T> {
  console.group(title);
  try {
    return action();
  } catch (e) {
    throw new Error('grouping failed due to action throwing an error ' + e);
  } finally {
    console.groupEnd();
  }
}

export function startGroup(
  type: ConsoleGroupToken | string,
  ...tags: (string | RegExp)[]
) {
  if (groupsEnabled) {
    groupStack.push(type);
    console.group([type, ...tags].join(' ').trim());
  }
}

export function endGroup(type: ConsoleGroupToken | string) {
  if (groupsEnabled) {
    const peek = groupStack.at(-1);
    if (peek !== type) {
      console.warn(
        `Attempting to end console group '${type}', however currently active group is '${peek}'. Make sure you end any open inner groups, and beware asynchronous grouping.`
      );
    }
    console.groupEnd();
    groupStack.pop();
  }
}
