import type {
  TableInstanceFactory,
  TableInstanceOptions,
  TableRecord,
  TableRowContext,
  TableRowMapper,
  TableShape,
} from "./types";

const CLASS_DETECTION_REGEX = /^class\s/;

export function defaultHeaderNormalizer(header: string): string | undefined {
  const trimmed = header.trim();
  if (!trimmed) {
    return undefined;
  }
  const sanitized = trimmed.replace(/[^0-9A-Za-z]+/g, " ").trim();
  if (!sanitized) {
    return undefined;
  }
  const segments = sanitized.split(/\s+/).filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return undefined;
  }
  const [first, ...rest] = segments as [string, ...string[]];
  const camel = [
    first.toLowerCase(),
    ...rest.map(
      (segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
    ),
  ].join("");
  return camel || undefined;
}

export function mapRecordsWithMapper<T>(
  records: readonly TableRecord[],
  shape: TableShape,
  mapper: TableRowMapper<T>
): T[] {
  if (records.length === 0) {
    return [];
  }
  return records.map((record, rowIndex) =>
    mapper(record, { shape, rowIndex })
  );
}

export function mapRecordsToInstances<T>(
  records: readonly TableRecord[],
  shape: TableShape,
  factory: TableInstanceFactory<T>,
  options: TableInstanceOptions<T> = {}
): T[] {
  if (records.length === 0) {
    return [];
  }
  const {
    headerMap,
    normalizeHeader,
    strict = false,
    assign = true,
    apply,
  } = options;

  const normalizer =
    (normalizeHeader as ((header: string) => string | undefined) | undefined) ??
    defaultHeaderNormalizer;

  return records.map((record, rowIndex) => {
    const context: TableRowContext = { shape, rowIndex };
    const instance = instantiate(factory, record, context);
    if (assign !== false) {
      for (const [header, value] of Object.entries(record)) {
        const property = resolveProperty(header, headerMap, normalizer);
        if (!property) {
          if (strict) {
            throw new RangeError(
              `No property mapping found for header '${header}' when transforming a ${shape} table row.`
            );
          }
          continue;
        }
        (instance as Record<string, unknown>)[property] = value;
      }
    }
    if (apply) {
      apply(instance, record, context);
    }
    return instance;
  });
}

function instantiate<T>(
  factory: TableInstanceFactory<T>,
  record: TableRecord,
  context: TableRowContext
): T {
  if (isClassFactory(factory)) {
    return new (factory as new () => T)();
  }
  if (factory.length >= 1) {
    return (factory as (record: TableRecord, context: TableRowContext) => T)(
      record,
      context
    );
  }
  return (factory as () => T)();
}

function isClassFactory<T>(factory: TableInstanceFactory<T>): boolean {
  if (typeof factory !== "function") {
    return false;
  }
  const source = Function.prototype.toString.call(factory);
  return CLASS_DETECTION_REGEX.test(source);
}

function resolveProperty<T>(
  header: string,
  headerMap: Readonly<Record<string, Extract<keyof T, string>>> | undefined,
  normalizeHeader: (header: string) => string | undefined
): Extract<keyof T, string> | undefined {
  if (headerMap && header in headerMap) {
    return headerMap[header];
  }
  const normalized = normalizeHeader(header);
  return normalized as Extract<keyof T, string> | undefined;
}
