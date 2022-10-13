import {
  action,
  HasTitle,
  HasURL,
  observation,
  Plans,
  procedure,
  ProcedureOf,
  StepOf,
  URLContains,
} from '@autometa/behaviors';
import { LoginAs } from '../behaviours/actions/homepage-actions';
import {
  AddItemToBasket,
  Logout,
  OpenMenu,
} from '../behaviours/actions/product-page-actions';
import { credentials } from '../communities/credentials';
import { SauceDemoPage } from '../page-objects/pages/homepage';

type LoginStep = StepOf<LoginPlans>;

export class LoginPlans extends Plans {
  @action(LoginAs(credentials.Johnny))
  toLoginWithCredentials: LoginStep;

  @observation(SauceDemoPage, URLContains('inventory.html'))
  toSeeTitle: LoginStep;
}
type ShoppingStep = StepOf<ShoppingPlans>;

export class ShoppingPlans extends Plans {
  @action(AddItemToBasket(0), AddItemToBasket(1))
  toAddFirstTwoItemsToBasket: ShoppingStep;
}

export class SauceDemoPlans extends Plans {
  @procedure(LoginPlans)
  toLogin: ProcedureOf<SauceDemoPlans, LoginPlans>;
  
  @procedure(ShoppingPlans)
  toShop: ProcedureOf<SauceDemoPlans, ShoppingPlans>;

  @action(OpenMenu, Logout)
  toLogout: ShoppingStep;

  @observation(SauceDemoPage, HasURL('https://www.saucedemo.com/'))
  toConfirmLoggedOut: ShoppingStep;
}
