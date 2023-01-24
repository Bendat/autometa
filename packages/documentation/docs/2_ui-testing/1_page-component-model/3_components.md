# Components

At the heart of this library are `Component`s. Components are an alternative to `WebElements`
and which hide or expose behaviors of a WebElement to express **intent**.

The base class for a Component is `Component`. A `Component` resembles a `WebElement` but hides
actions which are not applicable to all elements. `Component` is an abstract class and cannot
be instantiated directly.

There are a number of semantic components provided by default.

`Text` and its semantic versions `Paragraph`, `Heading1` etc. expose the `getText` method
as the property `text`, but does not expose `click`, because a `<p>` tag is not typically regarded
as clickable. If _your_ `<p>` tags have clicking behavior, you are encouraged to [build your own](creating-components)
semantic components. This way you show the intent of your web page, not just the elements it contains.

```ts title='my-page.ts'
export class MyPage {
  @component(By.id('my-id'))
  intro: Paragraph;
}
```

```ts title='my-page.test.ts'
const text = await myPage.intro.text;
await myPage.intro.click(); // tsc error, 'click' is not a property of Paragraph
```

A `Button` meanwhile exposes both `text` and `click`

```ts title='my-page.ts'
export class MyPage {
  @component(By.id('my-id'))
  addToCart: Button;
}
```

```ts title='my-page.test.ts'
const text = await myPage.addToCart.text;
await myPage.addToCart.click();
const newText = await myPage.addToCart.text;
expect(newText).toBe(`${text}(1)`);
```

## Element

By default the `Element` Component is also provided. This Component exposes all underlying behavior of WebElements
and may be regarded as a direct replacement for `WebElement`.

To stick with a more familiar pattern, use this in place of semantic components. In future direct support
for true web elements is intended (through the `LazyWebElement` pattern).

## Collections and Containers

Collections and Containers are both components which deal with groups of Components that relate to each other.
Collections act as a list of Components, while containers represent components with multiple collections inside
them.

[Read more about collections and containers](collections-containers)

## Exposing Behavior

By default all non-universal actions are disabled. `<p>` while technically clickable is not typically a clickable element. Unless your `<p>` tag for a Component does handle clicks, then the behavior
is hidden. To hide them, they are made `protected` by default in
component.

To expose behavior, simply create a public method in your Component
with the same name and assign it to your parent copy

```ts
export class MyComponent extends Component {
  click = this.click;
  write = this.write;
}
```

:::caution
Since these are raw class properties, 'this.click' etc. refers
to the already existing copy. similar to the following line of code

```ts
let x = 1;
x = x;
```

If you are wrapping them inside another method, or producing
a getter, you may need to call `super` instead, as at that point `this` has been fully initialized and may cause a stack overflow
:::

## Semantic Components

By default a number of Semantic Components are provided to represent certain tags, or types. These exist as building
blocks and references but are likely not enough to model a more sophisticated page.

Not every tag currently has a Component, nor is it likely they will.

Semantic Components can expose the same underlying behavior of a WebElement under a different name
if it makes sense to think of their behavior from a different perspective.

For example the `Option` (for `<option>`) Component exposes the `click()` behavior as both `click` and `choose`,
as you may wish to think of your virtual user as "choosing" an option, rather than the technical term of clicking.

Similarly, some Components like those that inherit from `Input` expose attributes as getter properties. All Components
expose their attributes through `getAttribute`, but some may choose to highlight them.

```ts title='some test'
const value = await page.input.value;
// equivalent of
const value = await page.input.getAttribute('value');
```

And likewise Anchor highlights `href` and `target`.

The following is a non exhaustive list of semantic tags available:

### Anchor

Tag: **`<a>`**

Represents a hyperlink/anchor.

_Exposes_:

_actions_

- `click`
- `getText` **as _`text`_** (getter)

_attributes_

- `href`
- `target`

---

### Button

Tag: **`<button>`**

Represents a simple button.

_actions_

- `click`
- `getText` **as _`text`_** (getter)

---

### Image

Tag: **`<img>`**

Represents an image

_actions_

- `click`

_attributes_

- `src`
- `alt`

## UnorderedList, OrderedList

Tag: **`<ul>`**

Represents an unordered list. Collection of type `Collection<ListItem>`. See [Collections](collections-containers)

## ListItem

Tag: **`<li>`**

_actions_

- `getText` **as _`text`_** (getter)

## Select

Tag: **`<select>`**

Collection of type `Collection<Option>`. Allows list-like
access to it's inner options

_behaviors_

- `select(byOrIndex)` - clicks on the `<select>`, finds the matching `<option>` by `By` locator or numeric index, and clicks on the option.

## Option

Tag: **`<option>`**

Simple text type for a form option.

_exposes_

- `click`
- `getText` **as _`text`_** (getter)

_attributes_

- `value`
