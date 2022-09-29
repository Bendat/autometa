import {
  About,
  ActingAs,
  EnvironmentContext,
  Switch,
  For,
  HasTitle,
  InterludeAction,
  Is,
  Seconds,
  Tab,
  User,
  Page,
} from '@autometa/behaviors';
import { Users } from '../communities/community';
import { LoginAs, Logout } from '../behaviours/actions/homepage-actions';
import { credentials } from '../communities/credentials';
import { SauceDemo } from '../page-objects/pages/homepage';
import {
  LoginBox,
  LoginErrorMessage,
} from '../behaviours/observations/homepage-observers';
import { LoginError } from '../behaviours/observations/error-messages';
import { Until } from '@autometa/page-components';
describe('Login Tests', () => {
  let Johnny: User;
  beforeEach(async () => ({ Johnny } = await ActingAs(Users).leadBy('Johnny')));
  afterEach(async () => Johnny.finish());
  const IsThisAnAntiPattern = About(LoginBox, Until.containsText, 'hello');
  it('Johnny Should Successfully Log In as a Standard User', async () => {
    await Johnny.will(LoginAs(credentials.Johnny))
      .and(Logout)
      .see(SauceDemo, HasTitle('Swag Labs'))
      .and(SauceDemo, HasTitle('Swag Labs'))
      .will(LoginAs('', ''));
  });

  it('Johnny Should Cannot Log In Without a Username', async () => {
    await Johnny.will(LoginAs(credentials.NoUsername)).and.see(
      LoginErrorMessage,
      Is(LoginError.NoUsername)
    );
  });

  it('Johnny Should Cannot Log In Without a Password', async () => {
    await Johnny.will(LoginAs(credentials.NoUsername)).and.see(
      LoginErrorMessage,
      Is(LoginError.NoUsername)
    );
  });

  it('Johnny Should Cannot Log In Without Credentials', async () => {
    await Johnny.will(LoginAs(credentials.NoMatch)).and.see(
      LoginErrorMessage,
      Is(LoginError.NoMatch)
    );
    // const John: { plans: JohnnyPlans } = (Johnny as any).plans as JohnnyPlans;
    // await John.plans
    //   .toLoginSuccessfully()
    //   .toConfirmHeLoggedIn()
    //   .toLoginSuccessfully();
  });
});
abstract class Plans<T extends Plans<T>> {
  [planName: string]: StepOf<T> | Plans<T> | Plans<any>;
  get and() {
    return this;
  }
}

abstract class Foo {}
class JohnnySubPlans extends Foo {
  // @action(LoginAs(credentials.Johnny))
  focaccia: StepOf<JohnnySubPlans>;
}
class JohnnyLoginPlans extends Foo {
  // @strategy()
  subplot: Procedure<JohnnySubPlans, JohnnyLoginPlans>;
  //   @action(LoginAs(credentials.Johnny))
  toProvideHisCredentials: StepOf<JohnnyLoginPlans>;
  //   @action(LoginAs(credentials.Johnny))
  toFailWithoutPassword: StepOf<JohnnyLoginPlans>;
  toFailWithoutUsername: StepOf<JohnnyLoginPlans>;
}

class JohnnyPlans implements Foo {
  //   @scheme()
  withLogin: Procedure<JohnnyLoginPlans, JohnnyPlans>;
  // @strategy()
  toLogin: Agenda<JohnnyLoginPlans, JohnnyPlans>;
  //   @action(LoginAs(credentials.Johnny))
  toLoginSuccessfully: StepOf<JohnnyPlans>;

  //   @observation(Page, HasTitle(''))
  //   @observation(LoginBox, Is(''))
  toConfirmHeLoggedIn: StepOf<JohnnyPlans>;
}

const johnnyPlans = new JohnnyPlans();
johnnyPlans
  .toLoginSuccessfully()
  .withLogin.toFailWithoutPassword()
  .recompose.andAgain.toConfirmHeLoggedIn()
  .withLogin
  .toProvideHisCredentials()
  .subplot.focaccia()
  .focaccia();

// allow only one level of nesting?
// alternatiely provide callback model?
// maybe rename subplot, make "trigger" a subplot (other users story)
