import {
  action,
  HasTitle,
  observation,
  Plans,
  StepOf,
} from '@autometa/behaviors';
import { LoginAs } from '../behaviours/actions/homepage-actions';
import { Logout } from '../behaviours/actions/product-page-actions';
import { credentials } from '../communities/credentials';
import { SauceDemoPage } from '../page-objects/pages/homepage';

type LoginStep = StepOf<LoginPlans>;

export class LoginPlans extends Plans {
  @action(LoginAs(credentials.Johnny))
  toLoginWithCredentials: LoginStep;

  @action(Logout)
  toLogout: LoginStep;

  @observation(SauceDemoPage, HasTitle('Swag Labs'))
  toSeeTitle: LoginStep;
}
