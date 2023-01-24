import { red, white, x240, x244, x250, yellow } from 'colors-cli';
import { bold, Color } from 'colors-cli/lib/color';
import getCurrentLine from 'get-current-line/';
import * as util from 'util';
import { ConsoleGroupToken } from './group-tokens';
const newLine = (arg: string) => `${arg}\n`;

export type LogLevels = 'log' | 'trace' | 'info' | 'debug' | 'error' | 'warn';
/**
 * Simple logger which provides behavior similar to how
 * `console.group` works in the browser.
 */
export class GroupLogger {
  #prefix = '';
  #groupStack: (ConsoleGroupToken | string)[] = [];
  #groupsEnabled = process.env.USE_LOGGING_GROUPS === 'true';

  set groupsEnabled(value: boolean) {
    this.#groupsEnabled = value;
  }
  get groupsEnabled() {
    return this.#groupsEnabled;
  }
  info = (...args: unknown[]) => {
    this.#writeOut('info', x250, ...args);
  };

  log = (...args: unknown[]) => {
    this.#writeOut('log', white, ...args);
  };

  debug = (...args: unknown[]) => {
    this.#writeOut('debug', x244, ...args);
  };

  trace = (...args: unknown[]) => {
    const err = new Error();
    const text = util.format(...args);
    this.#writeOut(
      'trace',
      x240,
      `${text}\n${err.stack?.replace('Error\n', '')}`
    );
  };
  error = (...args: unknown[]) => {
    if (args instanceof Error) {
      this.#writeErr('error', red, `${args}\n${args.stack}`);
      return;
    }
    const error = new Error(`${util.format(...args)}`);
    this.#writeErr('error', red, error);
  };

  warn = (...args: unknown[]) => {
    this.#writeErr('error', yellow, ...args);
  };

  /**
   * Causes all logs from this point to be indented 1 additional
   * level, titled by the provided text.
   *
   * Example
   * ```
   * logger.group('my group')
   * logger.info('my info')
   * // outputs:
   * My Group
   *    [info]
   *    my info
   *    /path/to/file 32:4
   * ```
   * @param name The displayed name of this group
   * @param tags Additional context strings to be appended to title
   */
  group = (name: ConsoleGroupToken | string, ...tags: (string | RegExp)[]) => {
    if (this.groupsEnabled !== true) {
      return;
    }
    this.#groupStack.push(name);
    const { prefix: themePrefix, titlePrefix, spacing } = theme;
    process.stdout.write(
      newLine(
        bold(format(this.#prefix, titlePrefix + [name, ...tags].join(' ')))
      )
    );
    this.#prefix += themePrefix + ' '.repeat(spacing);
  };

  /**
   * Clears a group and reduces log nesting by 1 level.
   * Logs a warning if the name to ungroup does not match
   * the name of the most recent group.
   * @param name The name of the group to close
   */
  ungroup = (name?: ConsoleGroupToken | string) => {
    if (this.#groupsEnabled !== true) {
      return;
    }
    const peek = this.#groupStack.at(-1);
    if (peek !== name) {
      console.warn(
        `Attempting to end console group '${name}', however currently active group is '${peek}'. Make sure you end any open inner groups, and beware asynchronous grouping.`
      );
    }
    this.#prefix = this.#prefix.slice(0, -cutLength());
    this.#groupStack.pop();
  };

  /**
   * Opens a group, executes the code inside it, then closes
   * the group when complete. Can return a value or a Promise if
   * the underlying action does.
   * @param title The name of the group
   * @param action The code to execute inside the group before closing
   * @returns the return value of {@see action}
   */
  grouping<T>(title: string, action: () => T | Promise<T>): T | Promise<T> {
    this.group(title);
    try {
      return action();
    } catch (e) {
      throw new Error('grouping failed due to action throwing an error ' + e);
    } finally {
      this.ungroup(title);
    }
  }

  #writeOut = (level: LogLevels, color: Color, ...args: unknown[]) => {
    const { newLine, callerString } = this.#prepareLog();
    process.stdout.write(
      newLine(formatColor(this.#prefix, color, 1, bold(`[${level}]`)))
    );
    process.stdout.write(newLine(formatColor(this.#prefix, color, 1, ...args)));
    process.stdout.write(
      newLine(formatColor(this.#prefix, color, 1, callerString))
    );
    process.stdout.write(newLine(format('')));
  };

  #writeErr = (level: LogLevels, color: Color, ...args: unknown[]) => {
    const { newLine, callerString } = this.#prepareLog();
    process.stderr.write(
      newLine(formatColor(this.#prefix, color, 1, bold(`[${level}]`)))
    );
    process.stderr.write(newLine(formatColor(this.#prefix, color, 1, ...args)));
    process.stderr.write(
      newLine(formatColor(this.#prefix, color, 1, callerString))
    );
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

function formatColor(
  prefix: string,
  color: Color,
  prepad: number,
  ...args: unknown[]
) {
  const asString = util.format(...args);
  const prepadding = ' '.repeat(prepad);
  return color(asString).replace(/^/gm, prefix + prepadding);
}

function getFramesToSkip() {
  const framesToSkip = 3;

  return {
    framesToSkip: {
      method: 'getCurrentLine',
      frames: framesToSkip,
      immediate: false,
    },
  };
}
