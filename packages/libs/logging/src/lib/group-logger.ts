import { red, white, x244, x250, yellow } from 'colors-cli';
import { bold, Color } from 'colors-cli/lib/color';
import getCurrentLine from 'get-current-line/';
import * as util from 'util';
import { ConsoleGroupToken } from './group-tokens';
const newLine = (arg: string) => `${arg}\n`;

export type LogLevels = 'log' | 'info' | 'debug' | 'error' | 'warn';
export class GroupLogger {
  #prefix = '';
  #groupStack: (ConsoleGroupToken | string)[] = [];

  format = (...args: unknown[]) => {
    const asString = util.format(...args);
    return asString.replace(/^/gm, this.#prefix);
  };

  info = (...args: unknown[]) => {
    this.#writeOut('info', x250, ...args);
  };

  log = (...args: unknown[]) => {
    this.#writeOut('log', white, ...args);
  };

  debug = (...args: unknown[]) => {
    this.#writeOut('debug', x244, ...args);
  };
  
  error = (...args: unknown[]) => {
    this.#writeOut('error', red, ...args);
  };

  warn = (...args: unknown[]) => {
    this.#writeOut('error', yellow, ...args);
  };

  group = (type: ConsoleGroupToken | string, ...tags: (string | RegExp)[]) => {
    this.#groupStack.push(type);
    const { prefix: themePrefix, titlePrefix, spacing } = theme;
    process.stdout.write(newLine(bold(format(this.#prefix, titlePrefix + [type, ...tags].join(' ')))));
    this.#prefix += themePrefix + ' '.repeat(spacing);
  };

  ungroup = (
    type?: ConsoleGroupToken | string
  ) => {
    const peek = this.#groupStack.at(-1);
    if (peek !== type) {
      console.warn(
        `Attempting to end console group '${type}', however currently active group is '${peek}'. Make sure you end any open inner groups, and beware asynchronous grouping.`
      );
      this.#prefix = this.#prefix.slice(0, -cutLength());
      this.#groupStack.pop();
    }
  };

  #writeOut = (level: LogLevels, color: Color, ...args: unknown[]) => {
    const { newLine, callerString } = this.#prepareLog();
    process.stdout.write(newLine(formatColor(this.#prefix, color, 1, bold(`[${level}]`))));
    process.stdout.write(newLine(formatColor(this.#prefix, color, 1, ...args)));
    process.stdout.write(newLine(formatColor(this.#prefix, color, 1, callerString)));
    process.stdout.write(newLine(format('')));
  };

  #writeErr = (level: LogLevels, color: Color, ...args: unknown[]) => {
    const { newLine, callerString } = this.#prepareLog();
    process.stderr.write(newLine(formatColor(this.#prefix, color, 1, bold(`[${level}]`))));
    process.stderr.write(newLine(formatColor(this.#prefix, color, 1, ...args)));
    process.stderr.write(newLine(formatColor(this.#prefix, color, 1, callerString)));
    process.stderr.write(newLine(format('')));
  };

  #prepareLog() {
    const { framesToSkip } = getFramesToSkip();
    const { line, char, file } = getCurrentLine(framesToSkip);
    const callerString = bold(`${file}:${line}:${char}`);
    const newLine = (arg: string) => `${arg}\n`;
    return { newLine, callerString };
  }
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
const cutLength = () => {
  const { prefix, spacing } = theme;
  return prefix.length + spacing;
};
const theme = themes.cleanTheme;

function format(prefix: string, ...args: unknown[]) {
  const asString = util.format(...args);
  return asString.replace(/^/gm, prefix);
}

function formatColor(prefix: string, color: Color, prepad: number, ...args: unknown[]) {
  const asString = util.format(...args);
  const prepadding = ' '.repeat(prepad);
  return color(asString).replace(/^/gm, prefix + prepadding);
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
