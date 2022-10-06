import 'reflect-metadata';
import {
  HasTitle,
  Is,
  Tab,
  User,
  Community,
  NoPlans,
  Which,
  New,
  SwitchesTo,
  ClosesTo,
  Return,
} from '@autometa/behaviors';
import { Users } from '../communities/community';
import { LoginAs } from '../behaviours/actions/homepage-actions';
import {
  AddFirstItemToBasket,
  Logout,
  OpenMenu,
} from '../behaviours/actions/product-page-actions';
import { credentials } from '../communities/credentials';
import { SauceDemo } from '../page-objects/pages/homepage';
import { LoginErrorMessage } from '../behaviours/observations/homepage-observers';
import { LoginError } from '../behaviours/observations/error-messages';
import { JennyGooglePlans, JohnnyLoginPlans } from '../plans/user-plans';

jest.setTimeout(1000000);
describe('Login Tests', () => {
  let Johnny: User<JohnnyLoginPlans>;
  let Jenny: User<JennyGooglePlans>;
  beforeEach(async () => {
    ({ Johnny, Jenny } = await Community.of(Users).following('Johnny'));
  });
  afterEach(async () => Johnny.finish());

  it('Johnny also run enny', async () => {
    await Johnny.will(LoginAs(credentials.Johnny))
      .see(SauceDemo, HasTitle('Swag Labs'))
      .meanwhile(Jenny, Tab('google', New), Which(SwitchesTo, 'initial'))
      .see(SauceDemo, HasTitle('Swag Labs'))
      .meanwhile(
        Jenny,
        Tab('google', Return),
        Which(ClosesTo, 'initial')
      );

    await new Promise((r) => setTimeout(r, 10000));
  });
  it('Johnny Should Successfully Log In as a Standard User', async () => {
    await Johnny.will(LoginAs(credentials.Johnny))
      .see(SauceDemo, HasTitle('Swag Labs'))
      .will(AddFirstItemToBasket, OpenMenu, Logout);
    await new Promise((r) => setTimeout(r, 10000));
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
    Johnny.plans
      .trigger(
        Tab('', New),
        Jenny.plans
          .toSearchForPuppies()
          .toSearchForPuppies()
          .toSearchForPuppies()
          .toSearchForPuppies()
          .toSearchForPuppies(),
        Which(SwitchesTo, 'initial')
      )
      .toLoginWithCredentials()
      .toSeeTitle();
    // const John: { plans: JohnnyPlans } = (Johnny as any).plans as JohnnyPlans;
    // await John.plans
    //   .toLoginSuccessfully()
    //   .toConfirmHeLoggedIn()
    //   .toLoginSuccessfully();
  });
});

describe('Plans', () => {
  let Johnny: User<JohnnyLoginPlans>;
  let Jenny: User<NoPlans>;
  beforeEach(
    async () =>
      ({ Johnny, Jenny } = await Community.of(Users).following('Johnny'))
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

test('metadata', () => {
  const s1 = {};
  const s2 = {};
  // Reflect.defineProperty(s1, 'mykey', {user: 'ben'})
  // Reflect.defineProperty(s2, 'mykey', 'cat')
  // console.log(Reflect.getOwnPropertyDescriptor(s1, 'mykey'))
  // console.log(Reflect.getOwnPropertyDescriptor(s2, 'mykey'))
});
// abstract class Plans<T extends Plans<T>> {
//   [planName: string]: StepOf<T> | Plans<T> | Plans<any>;
//   get and() {
//     return this;
//   }
// }

// abstract class Foo {}
// class JohnnySubPlans extends Foo {
//   @action(LoginAs(credentials.Johnny))
//   focaccia: StepOf<JohnnySubPlans>;
// }
// class JohnnyLoginPlans extends Foo {
//   @strategy()
//   subplot: Procedure<JohnnySubPlans, JohnnyLoginPlans>;
//   @action(LoginAs(credentials.Johnny))
//   toProvideHisCredentials: StepOf<JohnnyLoginPlans>;
//   @action(LoginAs(credentials.Johnny))
//   toFailWithoutPassword: StepOf<JohnnyLoginPlans>;
//   toFailWithoutUsername: StepOf<JohnnyLoginPlans>;
// }

// class JohnnyPlans implements Foo {
//   @action(LoginAs(credentials.Johnny))
//   toLoginSuccessfully: StepOf<JohnnyPlans>;

//   @observation(Page, HasTitle(''))
//   @observation(LoginBox, Is(''))
//   toConfirmHeLoggedIn: StepOf<JohnnyPlans>;
// }

// // const johnnyPlans = new JohnnyPlans();
// Johnny.plans
//   .toLoginSuccessfully()
//   .toLogin(async (has) => {
//     await has.toFailWithoutPassword().toJogOn((Ciaran) => Ciaran.toJogOn());
//   })
//   .withLogin.toFailWithoutPassword()
//   .recompose.andAgain.toConfirmHeLoggedIn()
//   .trigger(async ({ Jenny }) => {
//     await Jenny.plans
//       .toLogin(AdminAccount(credentials.Jenny))
//       .toVerifyBooking();
//   }, Switches, Tab)
//   .withLogin.toProvideHisCredentials()
//   .subplot.focaccia()
//   .trigger(async ({ Jenny }) => {
//     await Jenny.plans
//       .toCancelBooking();
//   }, Closes, Tab)
//   .will(Logout)

// allow only one level of nesting?
// alternatiely provide callback model?
// maybe rename subplot, make "trigger" a subplot (other users story)
