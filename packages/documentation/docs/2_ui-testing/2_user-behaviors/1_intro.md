# Introduction

**User Behaviors** is the complementary pattern for Page Components based on [The Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern.html).

:::info
this library depends on Page Components, and it should be
included in your project dependencies.

Page Components define the shape of your product, behaviors
abstract that shape into actions and observations a user
can or will take.
:::

The User Behavior Pattern pulls back on the theatrical metaphor of screenplay to focus on a more end-user oriented semantics, and provide a declarative manner of expressing tests in code.

User Behaviors are composed of 2 primary patterns: **Observation** and **Action**.

**Observations** are a behavior where the user _observes_ the state of the world they inhabit. Observations can be composed into an action, or used to verify values on the page.

**Action**s are a behavior where the user _acts_ on the world, such as clicking a button or typing their name.

Behaviors are executed by **Participants** in a **Focus Group**.

A **Participant** is virtual person, a user of your product and an actor in your tests. Participants are provided an itinerary of _observations_ and _actions_ to perform in a test to prove some business case.

A **Focus Group** is a group of **Participants** who are configured
to test your system in different ways. For example a "Customer" participant may visit your main product page and purchase items,
while a "Seller" may access a portal version of your website
where they can manage their purchased items and inventory.

## Quick Glance

Taking the following Page Component Model:

```ts
export class HomePage extends WebPage {
  @component(By.id('login-block'))
  loginModal: LoginModal;
}

export class LoginModal extends Component {
  @component(By.id('user-name'))
  userNameField: TextInput;

  @component(By.id('password'))
  passwordField: TextInput;

  @component(By.id('login-btn'))
  loginButton: Button;
}
```

Create an observer to find the login modal, and an action to log the user in.

```ts
export const LoginComponent = Observe(HomePage, ({ loginModal }) => loginModal);

export const LogInAs = ({ username, password }: Credentials) =>
  ActionOn(
    LoginComponent,
    async ({ usernameField, passwordField, loginButton }) => {
      await usernameField.write(username);
      await passwordField.write(password);
      await loginButton.click();
    }
  );

// Example Credentials Store somewhere in your project
export const credentials = {
  Johnny: { username: 'johnnym2', password: '*******' },
};
```

Create a group of users

```ts
@Browser(new Builder().forBrowser(Browser.CHROME))
export class Users {
  @Role('Customer') // Use roles that are relevant to your product
  @Browses(process.env.MY_URL)
  Johnny: User;
}
```

Start writing your test:

```ts
describe('Johnny Logs In', () => {
  let Johnny: User;
  // instantiate a new community for each test, Johnny will load a driver
  beforeEach(async () => ({ Johnny } = await FocusGroup.begin(Users)));
  // Exit the driver
  afterEach(async () => Johnny.finish());

  it('Johnny Should Successfully Log In as a Standard User', async () => {
    await Johnny.will(LoginAs(credentials.Johnny)).and.see(
      HomePage,
      HasTitle('Welcome, Johnny!')
    );
  });
});
```

## Why not just Page Components?

Page Components, being a form of Page Object Model, are best utilized as declarations of shape. They define the shape of your website or product as it appears to a consumer,
and they provide the means to interact with individual elements at their element level such
as clicking or typing.

One issue with using Page Components as your full test model is nesting/chaining,
as components are composed of more and more components, resulting in method chains that are repeated many times across your tests, and which may act as a propagating failure across many tests when the shape of the real page changes.

User Behaviors look to break these components back up again based on how the user actually interacts them in reality. They describe the parts of the page the user looks for, then the actions the user will take.

User behaviors describe clear intent about what the test should do. They are designed to read easily, minimize conditional logic, and ensure tests are as declarative as possible. Importantly,
behaviors are easily composable, giving testers the pieces they need to define a test, without
worrying about specific page details or implementations.
