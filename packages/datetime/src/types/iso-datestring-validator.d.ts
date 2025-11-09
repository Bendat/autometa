declare module "iso-datestring-validator" {
  export function isValidDate(value: string): boolean;
  export function isValidISODateString(value: string): boolean;
  export function isValidTime(value: string): boolean;
  export function isValidYearMonth(value: string): boolean;
}
