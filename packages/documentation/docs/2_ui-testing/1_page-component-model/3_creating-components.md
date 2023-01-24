# Building Your Own Components

While the provided semantic components like Paragraph and Button are useful, for more sophisticated container
types it's best to build components that model your own website or app.

Creating new components is as easy as defining a Page is. Simply export a class which inherits `Component` and
that contains properties with `@component()` decorators.

For example, imagine you have a `<div>` in your web page that contains some search options. We simply
create our Component model as before and use it from one of your pages (or components!)

```ts title=Example
export class SearchContainer extends Component {
  @component(By.id('search-bar'))
  searchBar: TextInput;

  @component(By.id('advance-check'))
  someAdvancedOption: Checkbox;

  @component(By.id('advance-check'))
  searchButton: Button;

  @component(By.css('#search-results a:nth-of-type(1)'))
  firstResult: Anchor;
}
```

You can now being using your component! Just add a reference to it to your Search Page

```ts title='/search.html'
export class SearchPage extends WebPage {
  @component(By.id('search-div'))
  searchContainer: SearchContainer;
}
```

And your tests:

```ts title='Cucumber test'
Given('A user on the search page', async function () {
  this.page = await Site(siteUrl, configuredDriver).Browse(SearchPage);
});

When(`They search for 'puppies`, async function () {
  await this.page.searchContainer.searchBar.write('puppies');
  await this.page.searchContainer.searchButton.click();
});

Then("The first result is for 'https://puppies.com'", async function () {
  const firstResult = await this.page.firstResult.href;
  expect(firstResult).toBe('https://puppies.com');
});
```

:::tip
There are interfaces for the hidden actions which correspond
to the Selenium name of that action, e.g. `click` implements `Click`
and `write` implements `SendKeys`.

If your linter is complaining about `click` etc. being implicitly type any, you can mark your methods as one of these interfaces. This
should shut up your linter while also providing more contextual
cues about your Page Model

Example:

```ts
export class MyComponent extends Component {
  click: Click = this.click;
  write: SendKeys = this.write;
}
```

:::

## Behaviors

You can also define behaviors on your Components by creating undecorated (custom or third party decorators should be supported) methods
or function properties.

```ts title=Example
export class SearchContainer extends Component {
  @component(By.id('search-bar'))
  searchBar: TextInput;

  @component(By.id('advance-check'))
  someAdvancedOption: Checkbox;

  @component(By.id('advance-check'))
  searchButton: Button;

  @component(By.css('#search-results a:nth-of-type(1)'))
  firstResult: Anchor;

  async searchFor(text: string, advanced: boolean = false) {
    await this.searchBar.type('puppies');
    if (advanced) {
      await this.someAdvancedOption.select();
    }
    await this.searchButton.click();
  }
}
```

Which simplifies our test some

```ts title='Cucumber test'
Given('A user on the search page', async function () {
  this.page = await Site(siteUrl, configuredDriver).Browse(SearchPage);
});

When(`They search for 'puppies`, async function () {
  await this.page.searchContainer.searchFor('puppies');
});

Then("The first result is for 'https://puppies.com'", async function () {
  const firstResult = await this.page.firstResult.href;
  expect(firstResult).toBe('https://puppies.com');
});
```

Or add a shortcut to your page

```ts title='/search.html'
export class SearchPage extends WebPage {
  @component(By.id('search-div'))
  searchContainer: SearchContainer;

  search(term: string, advanced = false) {
    return this.searchContainer.searchFor(term, advanced);
  }
}
```

```ts title='1-depth call'
Given('A user on the search page', async function () {
  this.page = await Site(siteUrl, configuredDriver).Browse(SearchPage);
});

When(`They search for 'puppies`, async function () {
  await this.page.searchFor('puppies');
});

Then("The first result is for 'https://puppies.com'", async function () {
  const firstResult = await this.page.firstResult.href;
  expect(firstResult).toBe('https://puppies.com');
});
```
