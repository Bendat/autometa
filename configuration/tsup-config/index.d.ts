import type { Options } from "tsup";

export type TsupConfig = Options | Options[];

export declare function createTsupConfig(options?: Options): TsupConfig;

declare const defaultConfig: TsupConfig;
export default defaultConfig;
