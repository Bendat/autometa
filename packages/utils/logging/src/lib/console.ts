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

export function useConsoleGroups() {
  groupsEnabled = true;
  console.log = consoleLog;
  console.info = consoleInfo;
  console.warn = consoleWarn;
  console.error = consoleError;
  console.group = consoleGroup;
  console.groupEnd = consoleGroupEnd;
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

type ConsoleBorderTheme = {
  prefix: string;
  titlePrefix: string;
  spacing: number;
};

const themes: { [key: string]: ConsoleBorderTheme } = {
  asciiTheme: { prefix: '│', titlePrefix: '├ ', spacing: 1 },
  cleanTheme: { prefix: ' ', titlePrefix: '', spacing: 1 },
};

const theme = themes.cleanTheme;

const cutLength = () => {
  const { prefix, spacing } = theme;
  return prefix.length + spacing;
};

let prefix = '';

function format(...args: unknown[]) {
  const asString = util.format(...args);
  return asString.replace(/^/gm, prefix);
}

function formatColor(color: StyleFunction, prepad: number, ...args: unknown[]) {
  const asString = util.format(...args);
  const prepadding = ' '.repeat(prepad);
  return color(asString).replace(/^/gm, prefix + prepadding);
}

function writeToStream(name: string, color: StyleFunction, ...args: unknown[]) {
  const { framesToSkip } = getFramesToSkip();
  const { line, char, file } = getCurrentLine(framesToSkip);
  const callerString = bold(`${file}:${line}:${char}`);
  const newLine = (arg: string) => `${arg}\n`;
  process.stdout.write(newLine(formatColor(color, 1, bold(`[${name}]`))));
  process.stdout.write(newLine(formatColor(color, 1, ...args)));
  process.stdout.write(newLine(formatColor(color, 1, callerString)));
  process.stdout.write(newLine(format('')));
}

function writeToErr(name: string, color: StyleFunction, ...args: unknown[]) {
  const { framesToSkip } = getFramesToSkip();
  const { line, char, file } = getCurrentLine(framesToSkip);
  const callerString = bold(`${file}:${line}:${char}`);
  const newLine = (arg: string) => `${arg}\n`;
  process.stderr.write(newLine(formatColor(color, 1, bold(`[${name}]`))));
  process.stderr.write(newLine(formatColor(color, 1, ...args)));
  process.stderr.write(newLine(formatColor(color, 1, callerString)));
  process.stderr.write(newLine(format('')));
}

function getFramesToSkip() {
  const framesToSkip = 2;

  return {
    framesToSkip: {
      method: 'getCurrentLine',
      frames: framesToSkip,
      immediate: false,
    },
  };
}

function consoleLog(...args: unknown[]) {
  writeToStream('Log', white, ...args);
}

function consoleError(...args: unknown[]) {
  writeToErr('Error', red, ...args);
}

function consoleWarn(...args: unknown[]) {
  writeToErr('Warn', yellow, ...args);
}

function consoleInfo(...args: unknown[]) {
  writeToStream('Info', blackBright, ...args);
}

function consoleGroup(...args: string[]) {
  const { prefix: themePrefix, titlePrefix, spacing } = theme;
  process.stdout.write(
    '\u001b[1m' + format(titlePrefix + args.join(' ')) + '\u001b[22m\n'
  );

  prefix += themePrefix + ' '.repeat(spacing);
}

function consoleGroupEnd() {
  prefix = prefix.slice(0, -cutLength());
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

export function areGroupsEnabled() {
  return groupsEnabled;
}

export function entitle(title: string) {
  if (groupsEnabled) {
    process.stdout.write('\u001b[1m' + format(title) + '\u001b[22m\n');
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
