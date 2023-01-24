import {
  ExtendedStepCallbackProvider,
  PreparedStepCallback,
  PreparedStepGroup,
  PreparedSteps,
  ScenarioSteps,
  // StepCallbackProvider,
  StepData,
  Steps,
} from '../../types';
import { assignRegexStep, assignTextStep } from '../../utils';

type StepMatcher = (
  regex: RegExp,
  group: string,
  callback: PreparedStepCallback
) => StepData | undefined;

export abstract class TestGroup {
  protected _title: string | undefined;
  protected _steps: PreparedSteps = new ScenarioSteps();
  protected _isPending: boolean;
  constructor(title?: string | undefined) {
    this._title = title;
  }
  get title() {
    return this._title;
  }
  get steps() {
    return this._steps;
  }

  abstract loadDefinedSteps(...callbacks: Steps[]): void;
  protected abstract _findMatch: StepMatcher;

  protected _step = (group: PreparedStepGroup) => {
    const fn = (ext: { global: boolean; pending: boolean }) => {
      return (text: string | RegExp, callback: PreparedStepCallback) => {
        this._isPending = ext.pending;

        if (text instanceof RegExp) {
          assignRegexStep(text, callback, group, this._findMatch);
          return;
        }
        assignTextStep(text, group, callback, ext.global);
      };
    };
    const root = fn({
      global: false,
      pending: false,
    }) as ExtendedStepCallbackProvider;
    const globalInner = fn({
      global: true,
      pending: false,
    }) as ExtendedStepCallbackProvider;
    const pendingInner = fn({
      global: false,
      pending: true,
    }) as ExtendedStepCallbackProvider;
    const pendingGlobal = fn({
      global: true,
      pending: true,
    }) as ExtendedStepCallbackProvider;
    globalInner.global = globalInner;
    globalInner.pending = pendingGlobal;
    globalInner.isGlobal = true;
    pendingInner.global = pendingInner;
    pendingInner.pending = pendingInner;
    pendingInner.isGlobal = false;
    pendingGlobal.global = pendingGlobal;
    pendingGlobal.pending = pendingGlobal;
    pendingGlobal.isGlobal = true;
    root.global = globalInner;
    root.pending = pendingInner;
    root.isGlobal = false;
    return root;
  };

  Given: ExtendedStepCallbackProvider = this._step(this._steps.Given);

  When: ExtendedStepCallbackProvider = this._step(this._steps.When);

  Then: ExtendedStepCallbackProvider = this._step(this._steps.Then);

  And: ExtendedStepCallbackProvider = this._step(this._steps.And);

  But: ExtendedStepCallbackProvider = this._step(this._steps.But);

  Shared = (...steps: Steps[]) => {
    this.loadDefinedSteps(...steps);
  };
}
