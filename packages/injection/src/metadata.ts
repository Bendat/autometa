import { AutometaSymbol } from "./symbol";
import { MetadataInfo } from "./types";
import { AutometaMetadata } from "./types";
export function metadata<T extends object>(target: T) {
  const withMetaData = target as T & {
    [AutometaSymbol.META_DATA]: AutometaMetadata;
  };
  if (!(AutometaSymbol.META_DATA in target)) {
    withMetaData[AutometaSymbol.META_DATA] = {};
  }
  const metadata = withMetaData[AutometaSymbol.META_DATA];

  return {
    set: (info: MetadataInfo) => {
      metadata[info.key] = info;
    },
    update: (key: string, updater: (info: MetadataInfo) => void) => {
      const current = metadata[key];
      if (!current) {
        const name = "name" in target ? target.name : target.constructor.name;
        const err = `Cannot create a constructor for ${name} as no metadata has been created for it. Try decorating it with '@Fixture'`;
        throw new Error(err);
      }
      updater(current);
    },
    custom: <T>(key: symbol, value: T) => {
      const md = withMetaData as unknown as Record<symbol, unknown>;
      md[key] = value;
    },
    getCustom: <T>(key: symbol): T => {
      const md = withMetaData as unknown as Record<symbol, unknown>;
      return md[key] as T;
    },
    get: (key: string): MetadataInfo => {
      return metadata[key];
    },
    get keys() {
      return Object.keys(metadata) as (keyof T)[];
    }
  };
}
