import { ContextHandler } from "./context-handler";

export class WindowContext {
  constructor(
    public readonly type: 'tab' | 'window',
    public readonly name: string,
    public readonly handler: ContextHandler
  ) {}
}
