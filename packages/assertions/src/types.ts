export type ExtractLiteralFromObject<TObj extends Record<string, unknown>, TString extends string> = TObj[TString] extends infer T ? T : never;
