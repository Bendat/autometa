export function interpolateStepText(
  text: string,
  table?: Record<string, string>
) {
  if (!table) return text;
  const tableKeys = Object.keys(table);

  let str = text;
  for (const key of tableKeys) {
    while (str.includes(`<${key}>`)) {
      str = str.replace(`<${key}>`, table[key]);
    }
  }
  return str;
}
