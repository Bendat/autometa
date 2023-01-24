import { SubplotWindow } from './context-handler';

export class WindowStartContext {
  constructor(
    public readonly type: 'tab' | 'window',
    public readonly name: string,
    public readonly handler: SubplotWindow
  ) {}
}
