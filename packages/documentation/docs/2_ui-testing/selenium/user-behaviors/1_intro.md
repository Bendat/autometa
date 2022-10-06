# Introduction

**User Behaviors** is the complementary pattern for [Page Components](../page-component-model/1_intro.md) based on [The Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern.html).

The User Behavior Pattern pulls back on the theatrical metaphor of screenplay to focus on a more end-user oriented semantics, and provide a declarative manner of expressing tests in code.

User Behaviors are composed of 2 primary patterns: **Observation** and **Action**.

**Observations** are a behavior where the user _observes_ the state of the world they inhabit. Observations can be composed into an action, or used to verify values on the page.

**Action**s are a behavior where the user _acts_ on the world, such as clicking a button or typing their name.

A **User** is virtual person, and an actor in your tests. Users are provided an itinerary of _observations_ and _actions_ to perform in a test to prove some business case.

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

Create a Community of users

```ts
@driver(new Builder().forBrowser(Browser.CHROME))
export class Users extends Community {
  @role('Standard User') // Use roles that are relevant to your product
  @browses(process.env.MY_URL)
  Johnny: User;
}
```

Start writing your test:

```ts
describe('Johnny Logs In', () => {
  let Johnny: User;
  // instantiate a new community for each test, Johnny will load a driver
  beforeEach(async () => ({ Johnny } = await ActingAs(Users).leadBy('Johnny')));
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

With full confidence that all Components are searched for recursively under their parents,
are properly awaited, and stale elements will be recovered.

## Why not just Page Components?

Page Components, being a form of Page Object Model, are best utilized as declarations
of shape. They define the shape of your website or product as it appears to a consumer,
and they provide the means to interact with individual elements at their element level such
as clicking or typing.

One issue with using Page Components as your full test model is nesting/chaining,
as components are composed of more and more components, resulting in method
chains that are repeated many times across your tests, and which may act as a propagating failure across many tests when the shape of the real page changes.

User Behaviors look to break these components back up again based on how the user actually
uses them in reality. They describe the parts of the page the user looks for, then the actions the user will take.

User behaviors describe clear intent about what the test should do. They are designed to read easily, minimize conditional logic, and ensure tests are as declarative as possible. Importantly,
behaviors are easily composable, giving testers the pieces they need to define a test, without
worrying about specific page details or implementations.

```ts

@driver(new Builder().forBrowser(Browser.Chrome))
class Users extends Community {
  @role('Traveller')
  @browses('hostelworld.com')
  @plans(JohnnysPlans)
  Johnny: User<JohnnysPlans>;

  @role('Property Manager')
  @browses('inbox.hostelworld.com')
  @plans(JennysPlans)
  Jenny: User<JennysPlans>;
}

class JohnnyLoginPlans extends Plans{
  @action(LoginAs(credentials.Johnny))
  toLoginSuccessfully: StepOf<JohnnyPlans>

  @action(LoginAs(credentials.Nameless))
  toFailToLoginWithoutUsername: StepOf<JohnnyPlans>

  @action(LoginAs(credentials.Passwordless))
  toFailToLoginWithoutPassword: StepOf<JohnnyPlans>
}

class JohnnyPlans extend Plans {
  @composed(JohnnyLoginPlans)
  toLogin: Procedure<JohnnyPlans, JohnnyLoginPlans>

  @action(SearchFor('hostel dublifornia'), SelectCheapest)
  toChooseACheapDublinHostel: StepOf<Johnny>
}

// Subplots - Jenny the Admin
const JennyToVerifyBooking = ({Jenny}: Community) => 
    Jenny.plans
      .toLogin()
      .toVerifyBooking()
      .verifyInventoryReduced();

const JennyToCancelHisBooking = ({Jenny}: Community) => Jenny.plans.toCancelBooking();

await Johnny.plans
  .toLogin(async (has)=>{
    await has.toLoginWithCredentials().withJog.toJogOn().recompose.andAgain.toBreakFree()
  })
  .toSearchForHostel()
  .toBookThreeWeekNights()
  .trigger(JennyToVerifyBooking, Switches, Tab)
  .toConfirmHisBooking()
  .trigger(JennyToCancelHisBooking, Closes, Tab)
  .toLogout();



  await Johnny.plans
  .withLogin.toLoginWithCredentials().recommence
  .toSearchForHostel()
  .toBookThreeWeekNights()
  .trigger(JennyVerifiesBooking, Switches, Tab)
  .toConfirmHisBooking()
  .trigger(JennyCancelsBooking, Closes, Tab)
  .toLogout();
```
