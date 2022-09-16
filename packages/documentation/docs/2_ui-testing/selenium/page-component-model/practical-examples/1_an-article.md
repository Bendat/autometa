# A Simple Article

Assume we have a Page with the following DOM, with
no classes or IDs

```html
<body>
  <article>
    <header>
      <h1>this is an article</h1>
      <p>isn't that just neat</p>
    </header>
    <p>This is my article</p>
    <a href="./learn-more"><em>Learn More</em></a>
  </article>
</body>
```

To start we can build our Page. Since there are no other
Components under `body`, we can skip a level of nesting
and access the article contents directly from the page. For
a page with multiple containers like this, they should
each be given their own Component - this reduces ambiguity
and simplifies locators.

```ts
export class MyPage {}
```

Next we will create our Header Component:

```ts
export class ArticleHeader extends Component {
  @component(By.css('h1'))
  title: Heading1;

  @component(By.css('p'))
  blurb: Paragraph;
}
```

And attach it to our page

```ts
export class MyPage {
  @component(By.css('header'))
  header: ArticleHeader;
}
```

Next we add our outer paragraph. The locator `By.css('p')` won't
work as it will first find the paragraph inside the header. Instead
we can look for adjacency `By.css('header+p')`

:::info
Strategies like `By.css('>p')` seem to work on some selenium implementations but not on `node`
:::

We can also add our `<a>` anchor.

```ts
export class MyPage {
  @component(By.css('header'))
  header: ArticleHeader;

  @component(By.css('header+p'))
  mainParagraph: Paragraph;

  @component(By.css('a'))
  learnMoreLink: Anchor;
}
```

Now we're ready to write tests. Our test will simply
assert that all the text fields hold their expected value

```ts
const url = process.env.MY_URL;
const wdBuilder = new Builder().forBrowser(Browser.Chrome);
const site = Site(url, wdBuilder);

describe('Validating text on my page', () => {
  let page: MyPage;

  beforeEach(async () => {
    page = await site.browse(MyPage);
  });
  it('should verify the article is correct', async () => {
    const { title, blurb } = page.header;
    const { mainParagraph, learnMoreLink } = page;

    expect(await title.text).toBe('this is an article');
    expect(await blurb.text).toBe("isn't that just neat");
    expect(await mainParagraph.text).toBe('This is my article');
    expect(await learnMoreL.text).toBe('Learn More');
  });

  it('should follow the learn more link', async () => {
    const { learnMoreLink } = page;

    await learnMoreLink.click();
    await page.waitForTitleIs('Learn More About My Article');
  });
});
``;
```
