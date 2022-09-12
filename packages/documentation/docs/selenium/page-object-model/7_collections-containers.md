# Collections And Containers

Collections and Containers are both components which deal with groups of Components that relate to each other.
Collections act as a list of Components, while containers represent components with multiple collections inside
them.

## Collections

_superclass_: `Collection<T>`

Collections are Components which contain a list of Components that share a shape/model, whose size is unknown, unbounded or dynamically modified.
Collections are intended to deal with only a single component type.

:::info
Collections are an abstract type and must be inherited by another component.
:::

Default implementations of Collections available are `OrderedList` and `UnorderedList`, which are of type `Collection<ListItem>`.

The child elements of a collection can be retrieved with `entries` which returns a `LazyElementArray`. `LazyElementArray` allows
safe access to child elements provided in DOM order.

Both `Collection` and `LazyElementArray` provide iterable-like access to child elements, such as `forEach`, `map` and `flatMap`.

Collections are intended to deal with container-types whose children are dynamic, but predictable and always the same "shape" or model. If a container type
holds heterogenous values, it's possible to use separate collections to manage each model.

### Using a Collection

Collection is an abstract type. Currently you must define your own Component and inherit Collection.

A provided example is the Component `UnorderedList`, which is a Collection of `ListItems`:

```ts
export class UnorderedList extends Collection<ListItem> {
  protected childType = ListItem;
  protected childElementLocator: By = By.css('li');
}
```

presuming the following html:

```html
<html>
  <ul>
    <li>first</li>
    <li>second</li>
    <li>third</li>
    <li>.. D!</li>
  </ul>
</html>
```

Added to our page model:

```ts
export class MyPage extends WebPage {
  @component(UnorderedList, By.css('ul'))
  myList: UnorderedList;
}
```

To test:

```ts
const entries = myPage.myList.entries;
const second = await entries.at(1);
expect(second).toBe('second');
```

Or for a div with multiple buttons:

```ts
export class ButtonList extends Collection<Button> {
  protected childType = Button;
  protected childElementLocator: By = By.css('button');
}
```

And you want to click them all in sequence

```ts
await myPage.mybuttons.forEach(async (button) => {
  await button.click();
});
```

:::info
These buttons will be clicked in DOM order. If Slow Mode is in effect, it will apply to these clicks.
:::
