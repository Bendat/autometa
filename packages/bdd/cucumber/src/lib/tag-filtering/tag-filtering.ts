type TagFilter = (tags: string[]) => boolean;
export function matchesFilter(
  filter: string | undefined,
  tags: string[]
): boolean {
  const tagRegex = /(@[A-Za-z-_0-9]+)/g;
  const matchedTags: string[] = [];
  let alteredExpression = filter + '';
  let match: RegExpMatchArray | null = null;

  do {
    match = tagRegex.exec(filter);
    const [_, matchedSubstring] = match ?? [];
    if (match) {
      alteredExpression = alteredExpression.replace(
        matchedSubstring,
        `(tags.indexOf("${match[1].toLowerCase()}")!==-1)`
      );
      if (matchedTags.includes(matchedSubstring)) {
        matchedTags.push(matchedSubstring);
      }
    }
  } while (match);
  const notRegex = /(\s+not|not\s+|\s+not\s+)/g;
  const orRegex = /(\s+or|or\s+|\s+or\s+)/g;
  const andRegex = /(\s+and|and\s+|\s+and\s+)/g;
  const whiteSpaceRegex = /[ \t\n\r]+/g;
  alteredExpression = alteredExpression.replace(notRegex, ' ! ');
  alteredExpression = alteredExpression.replace(orRegex, ' || ');
  alteredExpression = alteredExpression.replace(andRegex, ' && ');
  alteredExpression = alteredExpression.replace(whiteSpaceRegex, '');
  let filterFunction: (...args: unknown[]) => boolean | null = null;
  try {
    filterFunction = new Function(
      'tags',
      `return ${alteredExpression};`
    ) as TagFilter;
    // run empty to verify valid function string
    filterFunction([]);
  } catch (error) {
    throw new Error(`Unable to parse tag filter '${filter}'`);
  }
  return filterFunction(tags);
}
