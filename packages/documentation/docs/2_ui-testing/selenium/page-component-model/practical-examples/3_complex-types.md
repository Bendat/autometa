# Complex Types

Page Objects can compose the behavior of their child components into more complex types.

A default, provided example is `Select`, which implements the `<select>` tag.

Select is a `Collection<Option>`, that has the method `choose`, which allows the selection of an `<option>` by either `By` locator, or by DOM index.

Implementing `Select` is simple:

```ts
export class Select extends Collection<Option> {
  protected childType = Option;
  protected childElementLocator: By = By.css('option');
  protected override childIdentifierString = 'Option';

  get value() {
    return this.getAttribute('value');
  }

  click: Click = this.click;

  choose = async (byOrIndex: By | number) => {
    await this.click(); //     v----- Collection Components inherit array-like methods
    const selected = await this.at(byOrIndex);
    return selected?.choose();
  };
}
```

Option has the following implementation:

```ts
export class Option extends Component {
  get displayedText() {
    return this.read();
  }

  get value() {
    return this.getAttribute('value');
  }

  get label() {
    return this.getAttribute('label');
  }

  choose: Click = this.click;
  click: Click = this.click;
}
```
