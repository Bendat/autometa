declare module "@babel/code-frame" {
  export interface CodeFrameLocation {
    readonly start: { readonly line: number; readonly column: number };
    readonly end?: { readonly line: number; readonly column: number };
  }

  export interface CodeFrameColumnsOptions {
    readonly linesAbove?: number;
    readonly linesBelow?: number;
    readonly highlightCode?: boolean;
    readonly forceColor?: boolean;
    readonly message?: string;
  }

  export function codeFrameColumns(
    rawLines: string,
    location: CodeFrameLocation,
    options?: CodeFrameColumnsOptions
  ): string;
}
