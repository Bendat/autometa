# Variables, Regex and Expressions

Variables can be extracted from a Gherkin step using either
Regex or [Cucumber Expressions](https://github.com/cucumber/cucumber-expressions#readme).

Once extracted, the variable will be passed to the argument list
of the Step function being executed.

:::caution

Cucumber expressions will attempt to coerce the
type of the provided variable to the correct javascript
type. Custom parameter types are not currently supported
for Cucumber expressions.

Regex steps do not currently have type coercion, and
all variables will be considered a string.

:::

## Cucumber Expressions Example

Cucumber Expressions match a `{keyword}` from the step definition string, to a piece of text in the feature file step string.

E.g to match an alphanumeric word as a string, `{string}` is used, other options include `{int}`, `{float}`, and others.

Take the following step:

```gherkin
Scenario Outline: A Scenario Outline
    Given a <object> with <count> crabs inside

    Examples:
      | object | count |
      | bucket | 50    |
      | bowl   | 3     |
...
```

> N.b expressions work with normal scenarios, or outlines with variables inject, even on steps with no variables.

The step definition would then be

```ts
...
Given('a {word} with {int} crabs inside', ()=>{})
...
```

The values extracted can be taken from the argument list

```ts
...
Given('a {word} with {int} crabs inside', (obj: string, count: number)=>{
    console.log(obj) // prints 'bucket' then 'bowl'
    console.log(count) // prints 1 then 2
})
...
```

> Currently type transformation is only possible with Cucumber Expressions, and is not available for Regex

# Tables

The last or second to last variable passed to a step will
be its table, if one is defined:

```gherkin
Given a list of books and authors
| book                            | author      |
| The Good, The BDD, and The Ugly | Joe Millard |
```

```ts title="Step Definition"
Given('a list of books and authors', (table: GherkinTable)=>{
    const [firstItem] = table.rows;
    const [book, author] = firstItem;
    expect(book).toBe('The Good, The BDD, and The Ugly')
    expect(author).toBe('Joe Millard)
})
```
