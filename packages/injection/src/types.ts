import { Class } from "@autometa/types";
import { InjectionToken } from "./token";
export type BaseMetadata = {
  key: string;
  custom?: Record<string, unknown>;
};

export type InjectValueMetadata = BaseMetadata & {
  value: unknown;
  custom?: Record<string, unknown>;
};

export type InjectClassMetadata = BaseMetadata & {
  class: Class<unknown> | InjectionToken;
  custom?: Record<string, unknown>;
};

export type InjectFactoryMetadata = BaseMetadata & {
  factory: () => unknown;
  custom?: Record<string, unknown>;
};

export type InjectTokenMetadata = BaseMetadata & {
  token: InjectionToken;
  custom?: Record<string, unknown>;
};

export type MetadataInfo =
  | InjectClassMetadata
  | InjectValueMetadata
  | InjectFactoryMetadata
  | InjectTokenMetadata;

export type AutometaMetadata = {
  [key: string]: MetadataInfo;
};

export type InjectorKey = Class<unknown> | InjectionToken;
