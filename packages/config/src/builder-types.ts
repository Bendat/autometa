export type ModuleFormat = "cjs" | "esm";

export type SourceMapSetting = boolean | "inline" | "external";

export interface BuildHookContext {
  readonly cwd: string;
  readonly cacheDir: string;
  readonly outDir: string;
  readonly entries: readonly string[];
  readonly format: ModuleFormat;
  readonly target?: string | string[];
  readonly sourcemap?: SourceMapSetting;
  readonly tsconfig?: string;
  readonly external?: string[];
}

export type BuildHook = (context: BuildHookContext) => void | Promise<void>;

export interface BuilderHooks {
  before?: BuildHook[] | undefined;
  after?: BuildHook[] | undefined;
}

export interface BuilderConfig {
  format?: ModuleFormat | undefined;
  target?: string | string[] | undefined;
  sourcemap?: SourceMapSetting | undefined;
  tsconfig?: string | undefined;
  external?: string[] | undefined;
  outDir?: string | undefined;
  hooks?: BuilderHooks | undefined;
}