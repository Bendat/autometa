import 'reflect-metadata';
import {
  HasTitle,
  Is,
  Tab,
  User,
  FocusGroup,
  NoPlans,
  Which,
  New,
  SwitchesTo,
  ClosesTo,
  Return,
  Plans,
  Observe,
  observation,
  StepOf,
} from '@autometa/behaviors';
import { Users } from '../communities/community';
import { LoginAs } from '../behaviours/actions/homepage-actions';
import {
  AddFirstItemToBasket,
  Logout,
  OpenMenu,
} from '../behaviours/actions/product-page-actions';
import { credentials } from '../communities/credentials';
import { SauceDemoPage } from '../page-objects/pages/homepage';
import { LoginErrorMessage } from '../behaviours/observations/homepage-observers';
import { LoginError } from '../behaviours/observations/error-messages';
import { LoginPlans, SauceDemoPlans } from '../plans/user-plans';
//https://stackoverflow.com/questions/30689817/es6-call-class-constructor-without-new-keyword
const obs = Observe(SauceDemoPage, () => console.log('foo'));
class FakePlans extends Plans {
  @observation(obs, Is(undefined))
  toObserve: StepOf<FakePlans>;
}
jest.setTimeout(1000000);

describe('Login Tests', () => {
const focusGroup = FocusGroup.of(Users)

  let Johnny: User<SauceDemoPlans>;
  let Jenny: User<SauceDemoPlans>;
  let Conclude: ()=>Promise<void>;
  beforeEach(
    async () =>
      ({Johnny}  = await focusGroup.begin()
  );
  afterEach(async () => focusGroup.conclude());
  afterEach(async () => Conclude());

  it('Johnny also run enny', async () => {
    await Johnny
      .will(LoginAs(credentials.Johnny))
      .see(SauceDemoPage, HasTitle('Swag Labs'))
      .see(SauceDemoPage, HasTitle('Swag Labs'))


      // .meanwhile(
      //   (on)=> on(Tab, 'jennies', SwitchesTo, 'initial'),
      //   ({Jenny})=>Jenny.will(LoginAs(credentials.Johnny))
      // )
      // .on(Tab, 'jennies', SwitchesTo, 'initial')
      // .on(Idle, Tab, 'jennies', ClosesTo, 'initial')
      // .on(New, Tab, 'jennies', SwitchesTo, 'initial')
      // .meanwhile(Jenny, Tab('google', Return), Which(ClosesTo, 'initial'));

    await new Promise((r) => setTimeout(r, 10000));
  });
  it('Johnny Should Successfully Log In as a Standard User', async () => {
    await Johnny.will(LoginAs(credentials.Johnny))
      .see(SauceDemoPage, HasTitle('Swag Labs'))
      .will(AddFirstItemToBasket, OpenMenu, Logout);
    await new Promise((r) => setTimeout(r, 10000));
  });

  it('Johnny Cannot Log In Without a Username', async () => {
    await Johnny.will(LoginAs(credentials.NoUsername)).and.see(
      LoginErrorMessage,
      Is(LoginError.NoUsername)
    );
  });

  it('Johnny Cannot Log In Without a Password', async () => {
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
    Johnny.plans

      .toLoginWithCredentials()
      .toSeeTitle()
      .trigger(
        Tab('jennies', Return),
        Jenny.plans.toLoginWithCredentials(),
        Which(ClosesTo, 'initial')
      )
      .toLogout();
    // const John: { plans: JohnnyPlans } = (Johnny as any).plans as JohnnyPlans;
    // await John.plans
    //   .toLoginSuccessfully()
    //   .toConfirmHeLoggedIn()
    //   .toLoginSuccessfully();
  });
});

describe('Plans', () => {
  let Johnny: User<LoginPlans>;
  let Jenny: User<NoPlans>;
  beforeEach(
    async () =>
      ({ Johnny, Jenny } = await FocusGroup.of(Users).following('Johnny'))
  );
  afterEach(async () => Johnny.finish());
  test('plans', async () => {
    // await Johnny.plans
    //   .toLoginWithCredentials()
    //   .toSeeTitle()
    //   .trigger(Jenny, ({plans}) => {
    //     return plans.toLoginWithCredentials();
    //   }, Tab('inbox', 'my title');
  });
});
