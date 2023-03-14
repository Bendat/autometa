import { CucumberExpression, RegularExpression, Argument } from "@cucumber/cucumber-expressions";
import { TeardownHook, AfterHook, SetupHook, BeforeHook, Hook } from "@scopes/hook";
import type { ArrayElement } from "@typing/array-element";
import { StepAction } from "src/test-scopes/types";
import { TableType } from "./datatables/table-type";
import { CucumberParameters } from "./parameters";

const slots = ["Context", "Action", "Outcome", "Conjunction", "Unknown"] as const;

export type KeywordType = ArrayElement<typeof slots>;
export class StoredStep {
  constructor(
    readonly keywordType: ArrayElement<typeof slots>,
    readonly keyword: string,
    readonly text: CucumberExpression | RegularExpression,
    readonly action: StepAction,
    readonly tableType?: TableType<unknown>
  ) {}

  matches = (text: string) => {
    return this.text.match(text);
  };

  execute = (...args: unknown[]): void | Promise<void> => this.action(...args);
}
export class HookCache {
  #beforeEach: BeforeHook[] = [];
  #beforeAll: BeforeHook[] = [];
  #afterEach: BeforeHook[] = [];
  #afterAll: BeforeHook[] = [];
  constructor(readonly parent?: HookCache) {}
  addHook = (hook: Hook) => {
    if (hook instanceof BeforeHook) {
      this.#beforeEach.push(hook);
    } else if (hook instanceof SetupHook) {
      this.#beforeAll.push(hook);
    } else if (hook instanceof AfterHook) {
      this.#afterEach.push(hook);
    } else if (hook instanceof TeardownHook) {
      this.#afterAll.push(hook);
    } else {
      throw new Error("unrecognized hook " + hook);
    }
  };

  get before() {
    // if (this.parent) {
    //   return [...this.parent.#beforeEach, ...this.#beforeEach];
    // }
    return [...this.#beforeEach];
  }

  get setup() {
    return [...this.#beforeAll];
  }

  get after() {
    if (this.parent) {
      return [...this.parent.#afterEach, ...this.#afterEach];
    }
    return [...this.#afterEach];
  }

  get teardown() {
    return [...this.#afterAll];
  }
}
export class StepCache {
  private Context: StoredStep[] = [];
  private Action: StoredStep[] = [];
  private Outcome: StoredStep[] = [];
  private Conjunction: StoredStep[] = [];
  private Unknown: StoredStep[] = [];
  private keySet = new Map<KeywordType, Set<string | RegExp>>();
  constructor(readonly parent?: StepCache) {
    this.keySet.set("Action", new Set<string | RegExp>());
    this.keySet.set("Context", new Set<string | RegExp>());
    this.keySet.set("Outcome", new Set<string | RegExp>());
    this.keySet.set("Conjunction", new Set<string | RegExp>());
    this.keySet.set("Unknown", new Set<string | RegExp>());
  }
  add = (
    keywordType: KeywordType,
    keyword: string,
    text: string | RegExp,
    action: StepAction,
    tableType?: TableType<unknown>
  ) => {
    const textStr = text instanceof RegExp ? text.source : text;
    if (this.keySet.get(keywordType)?.has(textStr)) {
      throw new Error(`Step [${keyword} ${text}] already defined`);
    }
    this.keySet.get(keywordType)?.add(textStr);
    const expression =
      text instanceof RegExp
        ? new RegularExpression(text, CucumberParameters)
        : new CucumberExpression(text, CucumberParameters);
    const storedStep = new StoredStep(keywordType, keyword, expression, action, tableType);
    this[keywordType].push(storedStep);
  };

  find = (
    keywordType: KeywordType,
    keyword: string,
    text: string,
    throwIfNotFound = true
  ): { step: StoredStep; args: unknown[] } => {
    let bucket = [...this[keywordType]];
    let found = bucket.find((it) => it.matches(text));
    let args: unknown[] =
      found?.matches(text)?.map((match: Argument) => match.getValue(null)) ?? [];

    if (!found && (keywordType === "Conjunction" || keywordType === "Unknown")) {
      bucket = [...this.Context, ...this.Action, ...this.Outcome];
      found = bucket.find((it) => it.matches(text));
      args = found?.matches(text)?.map((match) => match.getValue(null)) ?? [];
    }
    if (!found) {
      const parentFound = this.parent?.find(keywordType, keyword, text, false);
      if (parentFound) {
        found = parentFound.step;
        args = parentFound.args;
      }
    }
    if (!found && throwIfNotFound) {
      throw new Error(`No stored step could be found matching [${keyword}${text}]`);
    }

    return { step: found as unknown as StoredStep, args };
  };
}
