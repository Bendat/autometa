# Page Components Model

### [Full Documentation/Tutorial Here](https://bendat.github.io/autometa/docs/ui-testing/page-component-model/intro)

**Autometa** Page Components Model is an (early and experimental) interpretation of the Page Object Model, built for use with selenium

## Quick Intro

Build Page Objects in a declarative manner, without instantiation or
wiring logic, and no explicit waiting in tests:

```ts
export class MyHomePage extends WebPage {
  @component(By.className('login-btn'))
  login: Button;
}
```

And that's enough to start testing:

```ts title='Using Jest'
const url = process.env.MY_URL;
const builder = new Builder().forBrowser(Browser.CHROME);
const site = Site(url, builder);

describe('Clicking the login button', () => {
  let page: MyHomePage;
  beforeEach(async () => {
    page = await site.browse(MyHomePage);
  });

  it('should wait for the page to load and click the login button', () => {
    await page.waitForTitleIs('My Home Page!');
    await page.login.click();
  });
});
```

Easily create new components to better describe the intent of your
Page Objects

```ts
export class MyLoginModal extends Component {
  @component(By.css('input[type="username"'))
  username: TextInput;
  @component(By.css('input[type="password"'))
  password: TextInput;
  // Automatically scoped to this modal. No conflict with
  // the '.login-btn' button in the parent DOM
  @component(By.className('login-btn'))
  login: Button;
}
```

Now start composing behavior

```ts title='my-login-modal.ts'
export class MyLoginModal extends Component {
  @component(By.css('input[type="username"'))
  username: TextInput;

  @component(By.css('input[type="password"'))
  password: TextInput;

  // Automatically scoped to this modal. No conflict with
  // the '.login-btn' button in the parent DOM.
  // Set wait-until condition and max timeout for slower items
  @component(By.className('login-btn'), Until.isDisplayed, 3500)
  login: Button;

  logUserIn = async (username: string, password: string) => {
    await this.username.write(username);
    await this.password.write(password);
    await login.click();
  };
}
```

And make a shortcut on our home-page if we like

```ts title='my-home-page.ts'
export class MyLoginModal extends Component {
  @component(By.id('login-modal'))
  loginModal: MyLoginModal;

  @component(By.className('login-btn'))
  login: Button;

  logUserIn = async (username: string, password: string) => {
    await login.click();
    await this.loginModal.logUserIn(username, password);
  };
}
```

And begin using it in tests

```ts title='Using Jest'
const url = process.env.MY_URL;
const builder = new Builder().forBrowser(Browser.CHROME);
const site = Site(url, builder);

describe('Logging the user in', () => {
  let page: MyHomePage;
  beforeEach(async () => {
    page = await site.browse(MyHomePage);
  });

  it('should log the user in', () => {
    await page.waitForTitleIs('My Home Page!');
    await page.logUserIn('myname', 'mYpa55');
    await page.waitForTitleIs('mynames Profile');
  });
});
```

Other pages can also be bound for easy navigation

```ts
export class MyHomePage extends WebPage {
  @page()
  myProfilePage: MyProfilePage;
}
```

## Benefits

### Declarative Model

Spend less time assembling Page Models. Declare models quickly
and focus on writing tests.

### Scoped Element Searches

Components automatically use their parents `WebElement` to initialize,
and only use the `WebDriver` if the parent Page Object is a WebPage.

### Lazy Initialization

Components initialize early so `WebElement`s don't have to. WebElements are handled lazily, loaded only when acted upon,
improving start up performance for element-based Page Object Models

### Automatic Waiting

Lazily loaded elements when activated will automatically be waited
for fluently. `Until` strategy can be configured multiple ways.

### Automatic Staleness Handling

Elements will detect when they're stale and propagate a refresh
request up the Page Model, forcing affected Components to lazily reload when next accessed instead of crashing.

### Automatic Logging

(WIP) - only supports `node` `console` at this time.

Every interaction with the WebDriver is logged in detail with 'breadcrumbs' describing
exactly what's happening in the tests

Example log:

```
  console.info
    Clicking On IndexPage[$root] >
      GridContainer[grid, By(css selector, .grid)] >
        SimpleTypeDiv[simpleTypes, By(css selector, div:nth-of-type(1))] >
          Button[button, By(css selector, button)]( { text: "Click Me" } )

      at Button.#logActionOccurring (src/lib/meta-types/component.ts:558:17)

  console.info
    Searching for [ListItem, By(css selector, li)] in IndexPage[$root] >
      GridContainer[grid, By(css selector, .grid)] >
        SimpleTypeDiv[simpleTypes, By(css selector, div:nth-of-type(1))] >
          UnorderedList[unorderedList, By(css selector, ul)]

      at ElementArray.<anonymous> (src/lib/meta-types/component.ts:540:17)
```

## Easily Handle Collections of Similar Models

Patterns provided for handling dynamic or indeterminate content which share a model or structure.

Example html:

```html
<ol>
  <li>first</li>
  <li>second</li>
  <li>third</li>
  <li>fourth</li>
</ol>
```

Example Page Model:

```ts
export class MyPageWithList extends WebPage {
  @collection(By.css('ol'), ListItem, By.css('li'))
  numericList: Collection<ListItem>;
}
```

Example test:

```ts
it('should check the list', () => {
  // array-like functions
  const expected = ['first', 'second', 'third', '...D!'];

  await page.numericList.forEach(async (li, idx) => {
    expect(await li.text).toBe(expected[idx]);
  });

  const mapped = await page.numericList.map(async (li) => li.text);
  expect(mapped).toStrictEqual(expected);

  expect(await page.numericList.at(0)).toBe(expected[0]);

  // works with for...of
  for (const li of await page.numericList.values) {
    expect(await li.text).toBe(expected.shift());
  }
});
```
