# Pages

A page is a simple class which defines properties decorated with `@page` or `@component`. A page must derive from the `WebPage` class.

To create a page, simply create your class:

```ts
export class MyHomePage extends WebPage {}
```

And that's it! You're ready to start testing.

```ts title='Jest Example'
import { siteUrl, configuredDriveBuilder } from '../my-setup';
const site = Site(siteUrl, configuredDriveBuilder);

describe('testing my home page loaded', () => {
  let page: MyHomePage;

  beforeEach(async () => {
    page = await site.Browse(MyHomePage);
  });

  it('should have the title "My Home Page"', async () => {
    await page.waitForTitleIs('My Home Page');
  });

  afterEach(async () => {
    await driver.quit();
  });
});
```

Now you can start adding [Components](components) to your page. Components are wrappers over `WebElement` that restrict
access to WebElements unless explicitly exposed. A number of [semantic Components](components#semantic-components) are
provided by default. You are encouraged to [make your own](creating-components) semantic Components that properly represent
your dom.

Using simple provided Components we can start creating our page model:

```ts
export class MyHomePage extends WebPage {
  @component(By.id('login-btn'))
  loginButton: Button;
}
```

Your button is now ready to interact with. Buttons expose the `getText()` and `click()` methods of Selenium as `text` (a getter, not a function) and `click()` respectively.

Perhaps you have already made a `LoginModal` component which provides input fields.

```ts
export class MyHomePage extends WebPage {
  @component(By.id('login-btn'))
  loginButton: Button;

  @component(By.id('login-modal'))
  loginModal: LoginModal;
}
```

Which brings you to a `ProfilePage` when submitted

```ts title='login-modal.ts'
export class LoginModal extends WebPage {
  @component(By.id('login-btn'))
  usernameField: TextInput;

  @component(By.id('login-btn'))
  passwordField: TextInput;

  submit: Submit = this.submit;

  // alternatively
  async submit() {
    await super.submit();
  }
}
```

```ts
export class MyHomePage extends WebPage {
  @page()
  profilePage: ProfilePage;

  @component(By.id('login-btn'))
  loginButton: Button;

  @component(By.id('login-modal'))
  loginModal: LoginModal;
}
```

And our test is now:

```ts title='Jest Example'
import { siteUrl, configuredDriver } from '../my-setup';
const site = Site(siteUrl, configuredDriver);

describe('testing my home page loaded', () => {
  let page: MyHomePage;

  beforeEach(async () => {
    page = await site.Browse(MyHomePage);
  });

  it('should have the title "My Home Page"', async () => {
    await page.waitForTitleIs('My Home Page');
    await page.loginButton.click();
    await page.loginModal.username.write('me@you.com');
    await page.loginModal.password.write('5ecur3');
    await page.loginModal.submit();
    await page.profilePage.waitForTitleIs('My Name');
  });

  afterEach(async () => {
    await driver.quit();
  });
});
```

:::tip
Page and WebComponent methods use fat-arrow functions and can be safely de-structured to reduce chaining.

```ts
it('should test my page', async () => {
  const {
    loginButton,
    searchBar,
    blogPosts: {
      highlighted: { title, intro, date },
      yesterdays: { date: yesterdaysDate },
    },
  } = myHomePage;

  await loginButton.click();
  await searchBar.showsSuggestion(
    "We've",
    "We've been trying to reach you about your cars extended warranty"
  );
  expect(await title.text).toBe('It might be one of the days of all time');
  expect(await yesterdaysDate.datetime).toBe(MyDateUtil.yesterday);

  // .... etc
});
```

`Site` has a `blueprint` method that will return a valid but
useless blueprint of your Page. It can be used to create a `let`
statement outside of your test functions which can be assigned by
`beforeEach`

e.g.

```ts
let {
    loginButton,
    searchBar,
    blogPosts: {
      highlighted: { title, intro, date },
      yesterdays: { date: yesterdaysDate },
    },
  } : MyHomePage = site.blueprint(MyHomePage)

beforeEach(()=>{
  ({
    loginButton,
    searchBar,
    blogPosts: {
      highlighted: { title, intro, date },
      yesterdays: { date: yesterdaysDate },
    },
  } = site.browse(MyHomePage))
}

it('should test my page', async () => {
  await loginButton.click();
  await searchBar.showsSuggestion(
    "We've",
    "We've been trying to reach you about your cars extended warranty"
  );
  expect(await title.text).toBe('It might be one of the days of all time');
  expect(await yesterdaysDate.datetime).toBe(MyDateUtil.yesterday);

  // .... etc
});
```

:::

You can also use functions in your Components. These can act to group behavior together
as you feel appropriate:

```ts
export class MyHomePage extends WebPage {
  @page()
  profilePage: ProfilePage;

  @component(By.id('login-btn'))
  loginButton: Button;

  @component(By.id('login-modal'))
  loginModal: LoginModal;

  async login(username: string, password: string) {
    await this.loginButton.click();
    await this.loginModal.login(username, password);
  }
}
```

```ts title='login-modal.ts'
export class LoginModal extends WebPage, Submittable {
  @component(By.id('username-field'))
  usernameField: TextInput;

  @component(By.id('password-field'))
  passwordField: TextInput;

  submit: Submit = this.submit

  async login(username: string, password: string){
    await this.usernameField.write(username)
    await this.usernameField.write(password)
    await this.submit()
  }
}
```

which makes our test:

```ts title='Jest Example'
import { siteUrl, configuredDriver } from '../my-setup';
const site = Site(siteUrl, configuredDriver);

describe('testing my home page loaded', () => {
  let page: MyHomePage;

  beforeEach(async () => {
    page = await site.Browse(MyHomePage);
  });

  it('should have the title "My Home Page"', async () => {
    await page.waitForTitleIs('My Home Page');
    await page.login('me@you.com', '5ecur3');
    await page.profilePage.waitForTitleIs('My Name');
  });

  afterEach(async () => {
    await driver.quit();
  });
});
```

## Launching other Pages

The `Site` function returns an object that contains a `browse` and both a `leave` and `quit` method. `leave` and `quit` exit
the `WebDriver` while `Browse` accepts a `WebPage` class reference (not an object instantiated with `new`, just the class blueprint).
Browse will instantiate your Web Page for you and all of it's dependencies.

It also contains `visit`, which is similar to browse except
it works on an already running WebDriver (browse will attempt to start
the WebDriver).

If a HTTP `route` is configured in the `WebPage` instance, `browse` and `visit` will attempt to load the configured route.

e.g

```ts
export class MySecondPage extends WebPage {
  override route = 'second';
}
```

Which for the url `my-site.com` will visit `my-site.com/second`. If
a route is passed to `browse` or `visit` it will override the inherited route.
